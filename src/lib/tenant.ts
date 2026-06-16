// src/lib/tenant.ts
import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  empresaId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

/**
 * Returns the empresaId bound to the current async request context.
 * Returns undefined when called outside an HTTP request scope (e.g., tests, CLI).
 */
export function getEmpresaId(): string | undefined {
  return tenantStorage.getStore()?.empresaId;
}