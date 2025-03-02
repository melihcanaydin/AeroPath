import { DistanceService } from '../services/distanceService';
import { RouteService } from '../services/routeService';
import { RedisCache } from '../services/redisCache';
import { AirportRepository } from '../infrastructure/repositories/airportRepository';
import { config } from './config';
import { HealthService } from '../services/healthService';
import { RequestTrackerMiddleware } from '../api/middlewares/requestTracker';
import { RouteResponse } from '../services/routeService';
import { LoggerService } from '../services/loggerService';

const logger = new LoggerService();
const redisCache = new RedisCache<RouteResponse>(config.redis.url);
const distanceService = new DistanceService();
const airportRepository = new AirportRepository();
const routeService = new RouteService(
    distanceService,
    config.redis.url,
    redisCache,
    airportRepository,
    logger
);
const healthService = new HealthService(redisCache, logger);
const requestTracker = new RequestTrackerMiddleware(logger);

export const container = {
    logger,
    redisCache,
    distanceService,
    airportRepository,
    routeService,
    healthService,
    requestTracker,
} as const; 