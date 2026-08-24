import type { Kysely, Transaction } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../../../db/types';

/**
 * Ativa a policy de Row-Level Security para um workspace dentro da transação atual.
 * Precisa rodar DENTRO de uma transação (usa `set_config(..., is_local = true)`, que só
 * vale até o commit/rollback). Usado pelo TenantInterceptor a cada request autenticada, e
 * por fluxos de bootstrap do Auth (register/accept-invite) que escrevem em tabelas
 * tenant-scoped antes de existir uma request "normal" com tenant já resolvido.
 */
export async function setWorkspaceRlsContext(
  trx: Transaction<Database> | Kysely<Database>,
  workspaceId: string,
): Promise<void> {
  await sql`select set_config('app.current_workspace_id', ${workspaceId}, true)`.execute(trx);
}
