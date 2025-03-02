import { Airport } from '../../models/Airport';

export interface IAirportRepository {
    findByCode(code: string): Promise<Airport | undefined>;
    findAll(): Promise<Airport[]>;
    findNearbyAirports(airport: Airport, maxDistance: number): Promise<Airport[]>;
} 