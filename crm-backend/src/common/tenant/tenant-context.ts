import { AsyncLocalStorage } from 'node:async_hooks';
import type { Transaction } from 'kysely';
import type { Database } from '../../../db/types';

export interface TenantStore {
  /** Cliente Kysely amarrado à transação de banco onde `app.current_workspace_id` foi setado. */
  trx: Transaction<Database>;
  workspaceId: string;
  workspaceMemberId: string;
  roleId: string;
  /** Lista de permissões resolvidas do role (ex.: ["companies:*", "opportunities:read"]). */
  permissions: string[];
}

export const tenantAls = new AsyncLocalStorage<TenantStore>();

/** Usar dentro de qualquer código que só faz sentido dentro de uma request autenticada e tenant-scoped. */
export function currentTenant(): TenantStore {
  const store = tenantAls.getStore();
  if (!store) {
    throw new Error(
      'Tenant context indisponível: este código rodou fora do TenantInterceptor (rota pública, job de sistema, ou bug de wiring).',
    );
  }
  return store;
}

export function currentTenantOrNull(): TenantStore | null {
  return tenantAls.getStore() ?? null;
}
