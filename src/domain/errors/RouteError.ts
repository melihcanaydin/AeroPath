import { BaseError } from './BaseError';

export class RouteNotFoundError extends BaseError {
    constructor(from: string, to: string) {
        super(
            `No route found between ${from} and ${to}`,
            'ROUTE_NOT_FOUND',
            404
        );
    }
} 