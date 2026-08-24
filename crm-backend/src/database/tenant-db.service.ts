import { Injectable } from '@nestjs/common';
import { currentTenant } from '../common/tenant/tenant-context';

/**
 * Injete isso em qualquer service de recurso tenant-scoped (companies, contacts,
 * opportunities, tasks, activities...). `.db` retorna o client Kysely amarrado à
 * transação da request atual — a mesma conexão onde o TenantInterceptor setou
 * `app.current_workspace_id`, então as policies de Row-Level Security te protegem
 * mesmo se um `where workspaceId = ...` for esquecido (que você não deve esquecer
 * mesmo assim — RLS é a rede de segurança, não a primeira linha de defesa).
 */
@Injectable()
export class TenantDb {
  get db() {
    return currentTenant().trx;
  }

  get workspaceId() {
    return currentTenant().workspaceId;
  }

  get workspaceMemberId() {
    return currentTenant().workspaceMemberId;
  }

  get permissions() {
    return currentTenant().permissions;
  }
}
