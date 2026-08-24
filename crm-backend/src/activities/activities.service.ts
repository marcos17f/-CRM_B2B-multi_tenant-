import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantDb } from '../database/tenant-db.service';
import { MANUAL_ACTIVITY_TYPES, type CreateActivityDto } from './dto/create-activity.dto';

export interface LogActivityParams {
  type: string;
  relatedToType: string;
  relatedToId: string;
  payload?: Record<string, unknown>;
  /** Default: o membro da request atual. Passe `null` para marcar como gerado pelo sistema/IA, sem autor humano. */
  actorId?: string | null;
}

@Injectable()
export class ActivitiesService {
  constructor(private readonly tenantDb: TenantDb) {}

  listForEntity(relatedToType: string, relatedToId: string) {
    return this.tenantDb.db
      .selectFrom('activities')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('relatedToType', '=', relatedToType)
      .where('relatedToId', '=', relatedToId)
      .orderBy('occurredAt', 'desc')
      .execute();
  }

  /** Feed do workspace inteiro (Visão Geral) — sem filtrar por entidade. O front resolve os nomes usando as listas que já tem em cache (companies/contacts/opportunities/equipment/service-orders). */
  listRecent(limit: number) {
    return this.tenantDb.db
      .selectFrom('activities')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .orderBy('occurredAt', 'desc')
      .limit(limit)
      .execute();
  }

  /**
   * Uso interno — chamado por outros services (OpportunitiesService.moveStage,
   * TasksService.complete...) pra registrar eventos de sistema na timeline. `activities`
   * é append-only no banco (ver db/migrations/002), então isto é a ÚNICA forma de gravar
   * — nunca há update/delete.
   */
  log(params: LogActivityParams) {
    return this.tenantDb.db
      .insertInto('activities')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        type: params.type,
        relatedToType: params.relatedToType,
        relatedToId: params.relatedToId,
        actorId: params.actorId === null ? null : (params.actorId ?? this.tenantDb.workspaceMemberId),
        payload: params.payload ?? {},
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /** Endpoint público (POST /activities) — só aceita os tipos "manuais" registrados por uma pessoa. */
  createManual(dto: CreateActivityDto) {
    if (!MANUAL_ACTIVITY_TYPES.includes(dto.type)) {
      throw new BadRequestException(`Tipo "${dto.type}" só pode ser gerado pelo sistema.`);
    }
    return this.log({
      type: dto.type,
      relatedToType: dto.relatedToType,
      relatedToId: dto.relatedToId,
      payload: dto.payload,
    });
  }
}
