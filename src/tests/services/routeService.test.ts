import { RouteService } from '../../services/routeService';
import { DistanceService } from '../../services/distanceService';
import { RedisCache } from '../../services/redisCache';
import { AirportRepository } from '../../infrastructure/repositories/airportRepository';
import { LoggerService } from '../../services/loggerService';
import { IRouteResponse } from '../../domain/interfaces/IRoute';

describe('RouteService', () => {
    let routeService: RouteService;
    let distanceService: DistanceService;
    let redisCache: RedisCache<IRouteResponse>;
    let airportRepository: AirportRepository;
    let logger: LoggerService;

    beforeEach(() => {
        distanceService = new DistanceService();
        redisCache = new RedisCache<IRouteResponse>();
        airportRepository = new AirportRepository();
        logger = new LoggerService();

        routeService = new RouteService(
            distanceService,
            'redis://localhost:6379',
            redisCache,
            airportRepository,
            logger
        );
    });

    describe('findShortestRoute', () => {
        it('should find route between valid airports', async () => {
            const result = await routeService.findShortestRoute('TLL', 'SFO');
            
            expect(result.status).toBe(200);
            expect(result.data).toMatchObject({
                source: 'TLL',
                destination: 'SFO',
                distance: expect.any(Number),
                hops: expect.any(Array)
            });
            expect((result.data as IRouteResponse).hops.length).toBeLessThanOrEqual(5);
        });

        it('should return error for invalid airports', async () => {
            const result = await routeService.findShortestRoute('XXX', 'YYY');
            
            expect(result.status).toBe(400);
            expect(result.data).toEqual({ error: 'Invalid airport code' });
        });

        it('should respect maximum 4 legs constraint', async () => {
            const result = await routeService.findShortestRoute('TLL', 'SYD');
            
            expect(result.status).toBe(200);
            expect((result.data as IRouteResponse).hops.length).toBeLessThanOrEqual(5);
        });

        it('should handle ground hops correctly', async () => {
            const result = await routeService.findShortestRoute('TLL', 'SFO', true);
            
            expect(result.status).toBe(200);
            expect(result.data).toHaveProperty('distance');
            expect((result.data as IRouteResponse).distance).toBeGreaterThan(0);
        });

        it('should use cache for repeated requests', async () => {
            const spy = jest.spyOn(redisCache, 'get');
            
            await routeService.findShortestRoute('TLL', 'SFO');
            await routeService.findShortestRoute('TLL', 'SFO');
            
            expect(spy).toHaveBeenCalledTimes(2);
        });
    });
}); 