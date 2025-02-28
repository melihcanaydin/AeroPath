import { RouteResponseDto } from '../models/route';
import { DistanceService } from './distanceService';
import routes from '../data/routes.json';
import airports from '../data/airports.json';

export class RouteService {
    constructor(private readonly distanceService: DistanceService) {}

    async findShortestRoute(from: string, to: string): Promise<RouteResponseDto | null> {
        const graph = this.buildGraph();
        const queue: any[] = [[from, 0, [from]]];
        const maxLegs = 4;

        let shortestRoute: string[] | null = null;
        let shortestDistance = Number.MAX_SAFE_INTEGER;

        while (queue.length) {
            const [current, distance, path] = queue.shift();
            if (current === to && path.length <= maxLegs + 1 && distance < shortestDistance) {
                shortestRoute = [...path];
                shortestDistance = distance;
                continue;
            }
            if (path.length <= maxLegs) {
                for (const [neighbor, dist] of graph[current] || []) {
                    if (!path.includes(neighbor)) {
                        queue.push([neighbor, distance + dist, [...path, neighbor]]);
                    }
                }
            }
        }

        return shortestRoute ? new RouteResponseDto(shortestRoute, shortestDistance) : null;
    }

    private buildGraph() {
        const graph: Record<string, [string, number][]> = {};

        for (const route of routes) {
            const fromAirport = airports.find((a) => a.code === route.from);
            const toAirport = airports.find((a) => a.code === route.to);

            if (fromAirport && toAirport) {
                const distance = this.distanceService.calculateDistance(
                    fromAirport.latitude, fromAirport.longitude,
                    toAirport.latitude, toAirport.longitude
                );
                if (!graph[route.from]) graph[route.from] = [];
                graph[route.from].push([route.to, distance]);
            }
        }

        return graph;
    }
}
