export const config = {
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        ttl: 3600
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        directory: 'logs'
    },
    server: {
        port: process.env.PORT || 3000
    }
}; 