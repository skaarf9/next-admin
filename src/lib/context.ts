import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  userId?: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();
