import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextHolder } from '../../services/requestContextHolder';
import { ILoggerService } from '../../domain/interfaces/services/ILoggerService';

export class RequestTrackerMiddleware {
    constructor(private readonly logger: ILoggerService) {}

    handle = (req: Request, res: Response, next: NextFunction): void => {
        const requestId = uuidv4();
        const context = {
            id: requestId,
            startTime: Date.now(),
            path: req.path,
            method: req.method
        };

        res.setHeader('X-Request-Id', requestId);

        this.logger.info('Request started', {
            requestId,
            method: req.method,
            path: req.path,
            query: req.query,
            headers: req.headers
        });

        res.on('finish', () => {
            const duration = Date.now() - context.startTime;
            this.logger.info('Request completed', {
                requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration
            });
        });

        RequestContextHolder.getInstance().run(context, next);
    };
} 