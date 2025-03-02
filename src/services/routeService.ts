import { DistanceService } from './distanceService';
import { RedisCache } from './redisCache';
import { LoggerService } from './loggerService';
import { RequestContextHolder } from './requestContextHolder';
import { PriorityQueue } from '../utils/PriorityQueue';
import { AirportRepository } from '../infrastructure/repositories/airportRepository';
import { loadAirportData, loadRouteData } from '../data';

export interface RouteResponse {
  source: string;
  destination: string;
  distance: number;
  hops: string[];
}

export class RouteService {
  private airports: Map<string, any> = new Map();
  private routes: Map<string, Map<string, number>> = new Map();

  constructor(
    private readonly distanceService: DistanceService,
    private readonly redisUrl: string,
    private readonly routeCache: RedisCache<RouteResponse>,
    private readonly airportRepository: AirportRepository,
    private readonly logger: LoggerService
  ) {
    this.initialize();
  }

  private async initialize() {
    const airportData = await loadAirportData();
    const routeData = await loadRouteData();

    airportData.forEach(airport => {
      if (airport.iata) {
        this.airports.set(airport.iata.toLowerCase(), airport);
      }
      if (airport.icao) {
        this.airports.set(airport.icao.toLowerCase(), airport);
      }
    });

    routeData.forEach(route => {
      const sourceCode = route.source.iata?.toLowerCase() || route.source.icao?.toLowerCase();
      const destCode = route.destination.iata?.toLowerCase() || route.destination.icao?.toLowerCase();
      
      if (sourceCode && destCode) {
        if (!this.routes.has(sourceCode)) {
          this.routes.set(sourceCode, new Map());
        }
        this.routes.get(sourceCode)!.set(destCode, route.distance);
      }
    });
  }

  async findShortestRoute(from: string, to: string, withGroundHops = false): Promise<{ status: number; data: RouteResponse | { error: string } }> {
    const requestId = RequestContextHolder.getInstance().getId();
    
    try {
      this.logger.info('Finding shortest route', { requestId, from, to, withGroundHops });

      from = from.toLowerCase();
      to = to.toLowerCase();

      const cacheKey = this.routeCache.generateKey([from, to, withGroundHops.toString()]);
      const cachedRoute = await this.routeCache.get(cacheKey);
      
      if (cachedRoute) {
        this.logger.debug('Cache hit', { requestId, cacheKey });
        return { status: 200, data: cachedRoute };
      }

      this.logger.debug('Cache miss', { requestId, cacheKey });

      if (!this.airports.has(from) || !this.airports.has(to)) {
        this.logger.warn('Invalid airport code', { requestId, from, to, validAirports: false });
        return { status: 400, data: { error: "Invalid airport code" } };
      }

      if (from === to) {
        const result = {
          source: from.toUpperCase(),
          destination: to.toUpperCase(),
          distance: 0,
          hops: [from.toUpperCase()]
        };
        await this.routeCache.set(cacheKey, result);
        return { status: 200, data: result };
      }

      const queue = new PriorityQueue<{ airport: string; distance: number; path: string[] }>(
        (a, b) => a.distance - b.distance
      );
      const visited = new Map<string, number>();
      
      queue.push({ airport: from, distance: 0, path: [from] });
      visited.set(from, 0);

      let shortestPath: string[] | null = null;
      let shortestDistance = Infinity;

      while (queue.length > 0) {
        const current = queue.pop()!;
        
        if (current.distance >= shortestDistance) continue;
        if (visited.get(current.airport)! < current.distance) continue;
        
        if (current.airport === to) {
          shortestPath = current.path;
          shortestDistance = current.distance;
          continue;
        }

        if (current.path.length >= 5) continue;

        const connections = this.routes.get(current.airport);
        if (connections) {
          for (const [nextAirport, distance] of connections) {
            const newDistance = current.distance + distance;
            if (!visited.has(nextAirport) || newDistance < visited.get(nextAirport)!) {
              visited.set(nextAirport, newDistance);
              queue.push({
                airport: nextAirport,
                distance: newDistance,
                path: [...current.path, nextAirport]
              });
            }
          }
        }

        if (withGroundHops) {
          const groundConnections = this.findNearbyAirports(current.airport, 100);
          for (const [nearbyAirport, groundDistance] of groundConnections) {
            const newDistance = current.distance + groundDistance;
            if (!visited.has(nearbyAirport) || newDistance < visited.get(nearbyAirport)!) {
              visited.set(nearbyAirport, newDistance);
              queue.push({
                airport: nearbyAirport,
                distance: newDistance,
                path: [...current.path, nearbyAirport]
              });
            }
          }
        }
      }

      if (!shortestPath) {
        this.logger.warn('No route found', { requestId, from, to, withGroundHops });
        return { status: 404, data: { error: "No route found" } };
      }

      const result = {
        source: from.toUpperCase(),
        destination: to.toUpperCase(),
        distance: Math.round(shortestDistance),
        hops: shortestPath.map(code => code.toUpperCase())
      };
      
      await this.routeCache.set(cacheKey, result);
      this.logger.info('Route found successfully', {
        requestId,
        from,
        to,
        hops: result.hops.length,
        distance: result.distance
      });

      return { status: 200, data: result };
    } catch (error) {
      this.logger.error('Route calculation error', error as Error, {
        requestId,
        from,
        to,
        withGroundHops
      });
      return this.findRouteWithoutCache(from, to, withGroundHops);
    }
  }

  private findNearbyAirports(airportCode: string, maxDistance: number): Map<string, number> {
    const nearby = new Map<string, number>();
    const airport = this.airports.get(airportCode);

    for (const [code, otherAirport] of this.airports) {
      if (code !== airportCode) {
        const distance = this.distanceService.calculateDistance(
          airport.location.latitude,
          airport.location.longitude,
          otherAirport.location.latitude,
          otherAirport.location.longitude
        );
        if (distance <= maxDistance) {
          nearby.set(code, distance);
        }
      }
    }

    return nearby;
  }

  private async findRouteWithoutCache(from: string, to: string, withGroundHops: boolean): Promise<{ status: number; data: RouteResponse | { error: string } }> {
    if (!this.airports.has(from) || !this.airports.has(to)) {
      return { status: 400, data: { error: "Invalid airport code" } };
    }

    const priorityQueue: Array<{ path: string[]; totalDistance: number }> = [{ path: [from], totalDistance: 0 }];
    const visited = new Map<string, number>();
    let shortestRoute: { path: string[]; totalDistance: number } | null = null;

    while (priorityQueue.length > 0) {
      priorityQueue.sort((a, b) => a.totalDistance - b.totalDistance);
      const current = priorityQueue.shift()!;
      const currentAirport = current.path[current.path.length - 1];

      if (currentAirport === to) {
        if (!shortestRoute || current.totalDistance < shortestRoute.totalDistance) {
          shortestRoute = current;
        }
        continue;
      }

      if (current.path.length > 5) continue;

      const connections = this.routes.get(currentAirport) || new Map();
      for (const [nextAirport, distance] of connections) {
        const newDistance = current.totalDistance + distance;
        if (!visited.has(nextAirport) || newDistance < visited.get(nextAirport)!) {
          visited.set(nextAirport, newDistance);
          priorityQueue.push({ path: [...current.path, nextAirport], totalDistance: newDistance });
        }
      }

      if (withGroundHops) {
        const groundConnections = this.findNearbyAirports(currentAirport, 100);
        for (const [nearbyAirport, groundDistance] of groundConnections) {
          const newDistance = current.totalDistance + groundDistance;
          if (!visited.has(nearbyAirport) || newDistance < visited.get(nearbyAirport)!) {
            visited.set(nearbyAirport, newDistance);
            priorityQueue.push({ path: [...current.path, nearbyAirport], totalDistance: newDistance });
          }
        }
      }
    }

    if (!shortestRoute) {
      return { status: 404, data: { error: "No route found" } };
    }

    return {
      status: 200,
      data: {
        source: from.toUpperCase(),
        destination: to.toUpperCase(),
        distance: Math.round(shortestRoute.totalDistance),
        hops: shortestRoute.path.map(code => code.toUpperCase())
      }
    };
  }
}
