import { IAirportRepository } from '../../domain/interfaces/repositories/IAirportRepository';
import { IAirport } from '../../domain/interfaces/IAirport';
import { loadAirportData } from '../../data';
import { DistanceService } from '../../services/distanceService';

export class AirportRepository implements IAirportRepository {
    private airports: Map<string, IAirport> = new Map();
    private distanceService: DistanceService;

    constructor() {
        this.distanceService = new DistanceService();
        this.initialize();
    }

    private async initialize() {
        const airports = await loadAirportData();
        airports.forEach(airport => {
            if (airport.iata) this.airports.set(airport.iata.toLowerCase(), airport);
            if (airport.icao) this.airports.set(airport.icao.toLowerCase(), airport);
        });
    }

    async findByCode(code: string): Promise<IAirport | undefined> {
        return this.airports.get(code.toLowerCase());
    }

    async findAll(): Promise<IAirport[]> {
        return Array.from(this.airports.values());
    }

    async findNearbyAirports(airport: IAirport, maxDistance: number): Promise<IAirport[]> {
        const nearby: IAirport[] = [];
        
        for (const otherAirport of this.airports.values()) {
            if (otherAirport.id === airport.id) continue;
            
            const distance = this.distanceService.calculateDistance(
                airport.location.latitude,
                airport.location.longitude,
                otherAirport.location.latitude,
                otherAirport.location.longitude
            );
            
            if (distance <= maxDistance) {
                nearby.push(otherAirport);
            }
        }
        
        return nearby;
    }
} 