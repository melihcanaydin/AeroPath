import { IRouteResponse } from '../IRoute';

export interface IRouteService {
    findShortestRoute(from: string, to: string, withGroundHops?: boolean): Promise<{
        status: number;
        data: IRouteResponse | { error: string };
    }>;
} 