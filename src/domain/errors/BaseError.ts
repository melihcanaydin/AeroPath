export class BaseError extends Error {
    constructor(
        public message: string,
        public code: string,
        public status: number
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
} 