import { haversine } from '../utils/haversine';

export class DistanceService {
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        return haversine(lat1, lon1, lat2, lon2);
    }
}
