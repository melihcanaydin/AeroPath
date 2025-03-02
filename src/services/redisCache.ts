import Redis from 'ioredis';
import { LoggerService } from './loggerService';

export class RedisCache<T> {
    private redis: Redis;
    private readonly TTL: number = 3600;
    private readonly logger: LoggerService;

    constructor(redisUrl?: string) {
        this.logger = new LoggerService();
        
        this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
            retryStrategy: (times: number): number => {
                return Math.min(times * 50, 2000);
            },
            maxRetriesPerRequest: 5,
            enableReadyCheck: true,
            reconnectOnError: (err: Error): boolean => {
                const targetError = 'READONLY';
                this.logger.error('Redis reconnection error', err);
                return err.message.includes(targetError);
            }
        });

        this.redis.on('error', (error: Error) => {
            this.logger.error('Redis connection error', error);
        });

        this.redis.on('connect', () => {
            this.logger.info('Successfully connected to Redis');
        });
    }

    generateKey(params: string[]): string {
        return `route:${params.join('|')}`;
    }

    async get(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, data: T): Promise<void> {
        await this.redis.setex(key, this.TTL, JSON.stringify(data));
    }

    async clear(): Promise<void> {
        await this.redis.flushdb();
    }

    async disconnect(): Promise<void> {
        await this.redis.quit();
    }
}