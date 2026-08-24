import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { from, Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import type { Database } from '../../../db/types';
import { KYSELY_RAW } from '../../database/database.constants';
import type { AuthenticatedUser } from '../../auth/types';
import { tenantAls } from './tenant-context';
import { setWorkspaceRlsContext } from './set-workspace-rls';

/**
 * Interceptor global (roda depois dos Guards, então `request.user` já existe quando
 * autenticado). Para toda request autenticada:
 *
 *   1. Abre uma transação Kysely.
 *   2. Roda `select set_config('app.current_workspace_id', <workspaceId>, true)` nela —
 *      é o que ativa as policies de Row-Level Security para essa transação especificamente.
 *   3. Guarda a transação + dados do tenant no AsyncLocalStorage (ver tenant-context.ts).
 *   4. Executa o resto do pipeline (pipes → controller → services) dentro desse contexto.
 *   5. Comita ao final; se qualquer coisa lançar, a transação inteira dá rollback.
 *
 * Serviços de recurso (companies, contacts, ...) usam `TenantDb` (não o client raw) para
 * pegar esse client transacional — é assim que o filtro de workspace_id da aplicação e a
 * RLS do banco acabam operando na mesma conexão/transação.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(@Inject(KYSELY_RAW) private readonly db: Kysely<Database>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    // Rota pública (ex.: /auth/login, /auth/register) — sem tenant, sem transação.
    if (!user) {
      return next.handle();
    }

    const resultPromise = this.db.transaction().execute(async (trx) => {
      await setWorkspaceRlsContext(trx, user.workspaceId);

      return tenantAls.run(
        {
          trx,
          workspaceId: user.workspaceId,
          workspaceMemberId: user.workspaceMemberId,
          roleId: user.roleId,
          permissions: user.permissions,
        },
        () => firstValueFrom(next.handle(), { defaultValue: undefined }),
      );
    });

    return from(resultPromise);
  }
}
