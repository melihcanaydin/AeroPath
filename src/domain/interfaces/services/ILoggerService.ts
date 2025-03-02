export interface ILoggerService {
    info(message: string, metadata?: any): void;
    error(message: string, error?: Error, metadata?: any): void;
    warn(message: string, metadata?: any): void;
    debug(message: string, metadata?: any): void;
} 