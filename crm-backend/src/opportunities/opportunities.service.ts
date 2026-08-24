import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Updateable } from 'kysely';
import type { OpportunitiesTable } from '../../db/types';
import { ActivitiesService } from '../activities/activities.service';
import { TenantDb } from '../database/tenant-db.service';
import { WorkflowsService } from '../workflows/workflows.service';
import type { CreateOpportunityDto } from './dto/create-opportunity.dto';
import type { MoveStageDto } from './dto/move-stage.dto';
import type { ReopenOpportunityDto } from './dto/reopen-opportunity.dto';
import type { UpdateOpportunityDto } from './dto/update-opportunity.dto';

export interface OpportunityFilters {
  pipelineId?: string;
  stageId?: string;
  ownerId?: string;
  status?: string;
}

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly activities: ActivitiesService,
    private readonly workflows: WorkflowsService,
  ) {}

  list(filters: OpportunityFilters) {
    let query = this.tenantDb.db.selectFrom('opportunities').selectAll().where('workspaceId', '=', this.tenantDb.workspaceId);
    if (filters.pipelineId) query = query.where('pipelineId', '=', filters.pipelineId);
    if (filters.stageId) query = query.where('stageId', '=', filters.stageId);
    if (filters.ownerId) query = query.where('ownerId', '=', filters.ownerId);
    if (filters.status) query = query.where('status', '=', filters.status);
    return query.orderBy('createdAt', 'desc').execute();
  }

  async get(id: string) {
    const opportunity = await this.tenantDb.db
      .selectFrom('opportunities')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!opportunity) throw new NotFoundException('Oportunidade não encontrada.');
    return opportunity;
  }

  /** Regra de negócio: stageId precisa pertencer a pipelineId (defendido de novo por trigger no banco). */
  private async assertStageBelongsToPipeline(stageId: string, pipelineId: string) {
    const stage = await this.tenantDb.db.selectFrom('pipelineStages').selectAll().where('id', '=', stageId).executeTakeFirst();
    if (!stage || stage.pipelineId !== pipelineId) {
      throw new BadRequestException('stageId não pertence ao pipelineId informado.');
    }
    return stage;
  }

  async create(dto: CreateOpportunityDto) {
    await this.assertStageBelongsToPipeline(dto.stageId, dto.pipelineId);

    const opportunity = await this.tenantDb.db
      .insertInto('opportunities')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        name: dto.name,
        companyId: dto.companyId,
        primaryContactId: dto.primaryContactId ?? null,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        type: dto.type ?? 'new_business',
        amount: dto.amount !== undefined ? String(dto.amount) : '0',
        currency: dto.currency ?? 'BRL',
        sourceCampaignId: dto.sourceCampaignId ?? null,
        ownerId: dto.ownerId ?? this.tenantDb.workspaceMemberId,
        expectedCloseDate: dto.expectedCloseDate ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.activities.log({
      type: 'system',
      relatedToType: 'opportunity',
      relatedToId: opportunity.id,
      payload: { event: 'created', stageId: opportunity.stageId },
    });

    return opportunity;
  }

  /** Edição livre de campos — bloqueada se a oportunidade já estiver fechada (ver /reopen). */
  async update(id: string, dto: UpdateOpportunityDto) {
    const current = await this.get(id);
    if (current.status !== 'open') {
      throw new ConflictException('Oportunidade fechada: use POST /opportunities/:id/reopen antes de editar (protege o histórico de forecast).');
    }

    const values: Updateable<OpportunitiesTable> = {};
    if (dto.name !== undefined) values.name = dto.name;
    if (dto.primaryContactId !== undefined) values.primaryContactId = dto.primaryContactId;
    if (dto.amount !== undefined) values.amount = String(dto.amount);
    if (dto.currency !== undefined) values.currency = dto.currency;
    if (dto.ownerId !== undefined) values.ownerId = dto.ownerId;
    if (dto.type !== undefined) values.type = dto.type;
    if (dto.riskLevel !== undefined) values.riskLevel = dto.riskLevel;
    if (dto.expectedCloseDate !== undefined) values.expectedCloseDate = dto.expectedCloseDate;

    return this.tenantDb.db
      .updateTable('opportunities')
      .set(values)
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * O coração do pipeline: mover para outro estágio. Se o estágio de destino for
   * won/lost, isso FECHA a oportunidade (seção 1.6 do documento de arquitetura) — e
   * "lost" exige lostReason. Toda chamada grava uma activity `stage_change`.
   */
  async moveStage(id: string, dto: MoveStageDto) {
    const opportunity = await this.get(id);
    if (opportunity.status !== 'open') {
      throw new ConflictException('Oportunidade já está fechada — use /reopen antes de mover de estágio.');
    }

    const stage = await this.assertStageBelongsToPipeline(dto.stageId, opportunity.pipelineId);

    if (stage.stageType === 'lost' && !dto.lostReason) {
      throw new BadRequestException('lostReason é obrigatório ao mover para um estágio de perda.');
    }

    const newStatus = stage.stageType;
    const updated = await this.tenantDb.db
      .updateTable('opportunities')
      .set({
        stageId: stage.id,
        status: newStatus,
        closedAt: newStatus === 'open' ? null : new Date(),
        lostReason: newStatus === 'lost' ? dto.lostReason : null,
      })
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.activities.log({
      type: 'stage_change',
      relatedToType: 'opportunity',
      relatedToId: id,
      payload: { fromStageId: opportunity.stageId, toStageId: stage.id, fromStatus: opportunity.status, toStatus: newStatus },
    });

    await this.workflows.handleOpportunityStageChanged(updated);

    return updated;
  }

  /** Reverte um fechamento — precisa apontar pra um estágio "open" do mesmo pipeline. */
  async reopen(id: string, dto: ReopenOpportunityDto) {
    const opportunity = await this.get(id);
    if (opportunity.status === 'open') {
      throw new ConflictException('Oportunidade já está aberta.');
    }

    const stage = await this.tenantDb.db.selectFrom('pipelineStages').selectAll().where('id', '=', dto.stageId).executeTakeFirst();
    if (!stage || stage.pipelineId !== opportunity.pipelineId || stage.stageType !== 'open') {
      throw new BadRequestException('Informe um estágio do tipo "open" do mesmo pipeline para reabrir.');
    }

    const updated = await this.tenantDb.db
      .updateTable('opportunities')
      .set({ status: 'open', stageId: stage.id, closedAt: null, lostReason: null })
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.activities.log({
      type: 'stage_change',
      relatedToType: 'opportunity',
      relatedToId: id,
      payload: { fromStageId: opportunity.stageId, toStageId: stage.id, fromStatus: opportunity.status, toStatus: 'open', reopened: true },
    });

    return updated;
  }
}
