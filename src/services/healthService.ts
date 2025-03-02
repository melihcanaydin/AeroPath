import { RedisCache } from './redisCache';
import { ILoggerService } from '../domain/interfaces/services/ILoggerService';

export class HealthService {
    constructor(
        private readonly redis: RedisCache<any>,
        private readonly logger: ILoggerService
    ) {}

    async check() {
        const health = {
            status: 'UP',
            redis: await this.checkRedis(),
            timestamp: new Date().toISOString()
        };

        return health;
    }

    private async checkRedis() {
        try {
            await this.redis.set('health-check', 'ok');
            return 'UP';
        } catch (error) {
            this.logger.error('Redis health check failed', error as Error);
            return 'DOWN';
        }
    }
} 