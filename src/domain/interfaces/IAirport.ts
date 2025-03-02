export interface IAirport {
    id: string;
    iata: string | null;
    icao: string | null;
    name: string;
    location: {
        latitude: number;
        longitude: number;
    };
} 