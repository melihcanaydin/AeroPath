import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from '../types/RequestContext';

export class RequestContextHolder {
    private static instance: RequestContextHolder;
    private storage: AsyncLocalStorage<RequestContext>;

    private constructor() {
        this.storage = new AsyncLocalStorage<RequestContext>();
    }

    public static getInstance(): RequestContextHolder {
        if (!RequestContextHolder.instance) {
            RequestContextHolder.instance = new RequestContextHolder();
        }
        return RequestContextHolder.instance;
    }

    public get(): RequestContext | undefined {
        return this.storage.getStore();
    }

    public run(context: RequestContext, next: () => void): void {
        this.storage.run(context, next);
    }

    public getId(): string | undefined {
        return this.storage.getStore()?.id;
    }

    public getStartTime(): number | undefined {
        return this.storage.getStore()?.startTime;
    }
} 