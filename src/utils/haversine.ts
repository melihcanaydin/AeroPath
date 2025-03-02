import { radians } from "../util";

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    lat1 = radians(lat1);
    lon1 = radians(lon1);
    lat2 = radians(lat2);
    lon2 = radians(lon2);

    const lat = lat2 - lat1;
    const lon = lon2 - lon1;

    const d = Math.pow(Math.sin(lat * 0.5), 2) + 
              Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(lon * 0.5), 2);

    const earthRadiusKm = 6371.0088;
    return 2.0 * earthRadiusKm * Math.asin(Math.sqrt(d));
}
