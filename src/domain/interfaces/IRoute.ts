import { IAirport } from './IAirport';

export interface IRoute {
    source: IAirport;
    destination: IAirport;
    distance: number;
}

export interface IRouteResponse {
    source: string;
    destination: string;
    distance: number;
    hops: string[];
} 