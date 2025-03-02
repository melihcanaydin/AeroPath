import { DistanceService } from '../../services/distanceService';

describe('DistanceService', () => {
    let distanceService: DistanceService;

    beforeEach(() => {
        distanceService = new DistanceService();
    });

    it('should calculate distance between two points', () => {
        const distance = distanceService.calculateDistance(
            59.4133, 24.8328,  // TLL coordinates
            37.6188, -122.3758 // SFO coordinates
        );
        
        expect(distance).toBeGreaterThan(0);
        expect(typeof distance).toBe('number');
    });

    it('should return zero for same coordinates', () => {
        const distance = distanceService.calculateDistance(
            59.4133, 24.8328,
            59.4133, 24.8328
        );
        
        expect(distance).toBe(0);
    });
}); 