import { AsyncLocalStorage } from 'async_hooks';

export const storage = new AsyncLocalStorage<string>();

export const getTraceId = (): string => {
    const store = storage.getStore();
    return store || 'no-trace-id';
};
