import winston from 'winston';
import { format } from 'winston';
import { config } from '../config/config';

const { combine, timestamp, colorize, printf } = format;

interface RequestHeaders {
    'user-agent'?: string;
    'accept'?: string;
    'content-type'?: string;
    [key: string]: string | undefined;
}

export class LoggerService {
    private logger: winston.Logger;

    constructor() {
        const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
            const cleanMetadata = { ...metadata };
            delete cleanMetadata.error;
            delete cleanMetadata.stack;

            if (cleanMetadata.headers) {
                const headers = cleanMetadata.headers as RequestHeaders;
                cleanMetadata.headers = {
                    'user-agent': headers['user-agent'],
                    'accept': headers['accept'],
                    'content-type': headers['content-type']
                };
            }

            let log = `${timestamp} [${level}]: ${message}`;
            
            if (cleanMetadata.requestId) {
                log += ` (RequestId: ${cleanMetadata.requestId})`;
            }

            if (cleanMetadata.duration) {
                log += ` - ${cleanMetadata.duration}ms`;
            }

            const relevantInfo = Object.entries(cleanMetadata)
                .filter(([key]) => !['requestId', 'duration'].includes(key))
                .filter(([_, value]) => value !== undefined);

            if (relevantInfo.length > 0) {
                log += `\n  ${relevantInfo
                    .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
                    .join('\n  ')}`;
            }

            if (metadata.error || metadata.stack) {
                log += '\n  Error Details:';
                if (metadata.error) log += `\n    Message: ${metadata.error}`;
                if (metadata.stack) log += `\n    Stack: ${metadata.stack}`;
            }

            return log;
        });

        this.logger = winston.createLogger({
            level: config.logging.level,
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                customFormat
            ),
            transports: [
                new winston.transports.Console({
                    format: combine(
                        colorize({ all: true }),
                        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                        customFormat
                    )
                }),
                new winston.transports.File({ 
                    filename: `${config.logging.directory}/error.log`,
                    level: 'error'
                }),
                new winston.transports.File({ 
                    filename: `${config.logging.directory}/combined.log`
                })
            ]
        });
    }

    info(message: string, metadata?: any): void {
        this.logger.info(message, this.cleanMetadata(metadata));
    }

    error(message: string, error?: Error, metadata?: any): void {
        this.logger.error(message, {
            error: error?.message,
            stack: error?.stack,
            ...this.cleanMetadata(metadata)
        });
    }

    warn(message: string, metadata?: any): void {
        this.logger.warn(message, this.cleanMetadata(metadata));
    }

    debug(message: string, metadata?: any): void {
        this.logger.debug(message, this.cleanMetadata(metadata));
    }

    private cleanMetadata(metadata?: any): Record<string, any> {
        if (!metadata) return {};
        
        const cleaned = JSON.parse(JSON.stringify(metadata));
        
        Object.keys(cleaned).forEach(key => {
            if (cleaned[key] === undefined || cleaned[key] === null) {
                delete cleaned[key];
            }
        });

        return cleaned;
    }
} 