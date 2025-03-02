export interface IRouteCache<T> {
    generateKey(params: string[]): string;
    get(key: string): Promise<T | null>;
    set(key: string, data: T): Promise<void>;
    clear(): Promise<void>;
    disconnect(): Promise<void>;
} 