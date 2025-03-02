import { RedisCache } from '../../services/redisCache';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('RedisCache', () => {
    let redisCache: RedisCache<any>;
    
    beforeEach(() => {
        redisCache = new RedisCache<any>('redis://localhost:6379');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateKey', () => {
        it('should generate correct cache key', () => {
            const key = redisCache.generateKey(['TLL', 'SFO', 'false']);
            expect(key).toBe('route:TLL|SFO|false');
        });
    });

    describe('get', () => {
        it('should return null for cache miss', async () => {
            (Redis.prototype.get as jest.Mock).mockResolvedValue(null);
            
            const result = await redisCache.get('test-key');
            expect(result).toBeNull();
        });

        it('should return parsed data for cache hit', async () => {
            const mockData = { test: 'data' };
            (Redis.prototype.get as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
            
            const result = await redisCache.get('test-key');
            expect(result).toEqual(mockData);
        });
    });

    describe('set', () => {
        it('should set data with TTL', async () => {
            const setex = Redis.prototype.setex as jest.Mock;
            const data = { test: 'data' };
            
            await redisCache.set('test-key', data);
            
            expect(setex).toHaveBeenCalledWith(
                'test-key',
                3600,
                JSON.stringify(data)
            );
        });
    });
}); 