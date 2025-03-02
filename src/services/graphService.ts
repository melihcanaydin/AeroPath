import { IAirportRepository } from '../domain/interfaces/repositories/IAirportRepository';
import { IRouteRepository } from '../domain/interfaces/repositories/IRouteRepository';
import { Connection } from '../domain/models/Connection';
import { Airport } from '../domain/models/Airport';
import { Route } from '../domain/models/Route';

export class GraphService {
  private readonly graph: RouteGraph = new RouteGraph();

  constructor(
    private readonly airportRepository: IAirportRepository,
    private readonly routeRepository: IRouteRepository
  ) {}

  async initialize(): Promise<void> {
    const airports = await this.airportRepository.findAll();
    const routes = await this.routeRepository.findAll();
    await this.graph.initialize(airports, routes);
  }

  getConnections(airport: string): Connection[] {
    return this.graph.getConnections(airport);
  }
}

class RouteGraph {
  private readonly adjacencyList: Map<string, Set<Connection>> = new Map();

  async initialize(_airports: Airport[], routes: Route[]): Promise<void> {
    this.buildAdjacencyList(routes);
  }

  private buildAdjacencyList(routes: Route[]): void {
    routes.forEach((route: Route) => {
      const sourceId = route.source.id;
      const connection: Connection = {
        destination: route.destination,
        distance: route.getDistance()
      };

      if (!this.adjacencyList.has(sourceId)) {
        this.adjacencyList.set(sourceId, new Set());
      }
      this.adjacencyList.get(sourceId)!.add(connection);
    });
  }

  getConnections(airport: string): Connection[] {
    return Array.from(this.adjacencyList.get(airport) || []);
  }
} 