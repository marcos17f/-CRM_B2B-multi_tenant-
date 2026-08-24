import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantDb } from '../database/tenant-db.service';
import { RfmService } from '../reports/rfm.service';
import type { AddSegmentMemberDto } from './dto/add-segment-member.dto';
import type { CreateSegmentDto } from './dto/create-segment.dto';

const ALLOWED_SMART_CRITERIA_KEYS = [
  'rfmSegment',
  'industry',
  'status',
  'monetaryScoreGte',
  'frequencyScoreGte',
  'recencyScoreGte',
] as const;

interface SmartSegmentCriteria {
  rfmSegment?: string;
  industry?: string;
  status?: string;
  monetaryScoreGte?: number;
  frequencyScoreGte?: number;
  recencyScoreGte?: number;
}

@Injectable()
export class SegmentsService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly rfm: RfmService,
  ) {}

  list() {
    return this.tenantDb.db
      .selectFrom('segments as s')
      .leftJoin('segmentMembers as sm', 'sm.segmentId', 's.id')
      .select(['s.id', 's.name', 's.type', 's.criteria', 's.createdAt', 's.updatedAt'])
      .select((eb) => eb.fn.count<string>('sm.companyId').as('memberCount'))
      .where('s.workspaceId', '=', this.tenantDb.workspaceId)
      .groupBy('s.id')
      .orderBy('s.createdAt', 'desc')
      .execute();
  }

  async get(id: string) {
    const segment = await this.tenantDb.db
      .selectFrom('segments')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!segment) throw new NotFoundException('Segmento não encontrado.');
    return segment;
  }

  private assertValidCriteria(criteria: Record<string, unknown> | null | undefined): SmartSegmentCriteria {
    if (!criteria) throw new BadRequestException('Segmentos "smart" exigem "criteria".');
    const unknownKeys = Object.keys(criteria).filter((k) => !(ALLOWED_SMART_CRITERIA_KEYS as readonly string[]).includes(k));
    if (unknownKeys.length > 0) {
      throw new BadRequestException(
        `Critério(s) não suportado(s): ${unknownKeys.join(', ')}. Aceitos: ${ALLOWED_SMART_CRITERIA_KEYS.join(', ')}.`,
      );
    }
    return criteria as SmartSegmentCriteria;
  }

  async create(dto: CreateSegmentDto) {
    if (dto.type === 'smart') this.assertValidCriteria(dto.criteria);

    const segment = await this.tenantDb.db
      .insertInto('segments')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        name: dto.name,
        type: dto.type,
        criteria: dto.criteria ?? null,
        createdBy: this.tenantDb.workspaceMemberId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    if (dto.type === 'smart') await this.recomputeSmartSegment(segment.id);

    return segment;
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.tenantDb.db.deleteFrom('segments').where('id', '=', id).where('workspaceId', '=', this.tenantDb.workspaceId).execute();
  }

  async listMembers(segmentId: string) {
    await this.get(segmentId); // garante 404 se não existir/não for deste tenant
    return this.tenantDb.db
      .selectFrom('segmentMembers')
      .innerJoin('companies', 'companies.id', 'segmentMembers.companyId')
      .select(['companies.id', 'companies.name', 'companies.industry', 'companies.status', 'segmentMembers.addedAt'])
      .where('segmentMembers.segmentId', '=', segmentId)
      .orderBy('segmentMembers.addedAt', 'desc')
      .execute();
  }

  async addMember(segmentId: string, dto: AddSegmentMemberDto): Promise<void> {
    const segment = await this.get(segmentId);
    if (segment.type !== 'manual') {
      throw new ConflictException('Só é possível adicionar membros manualmente em segmentos do tipo "manual" — use /recompute em segmentos "smart".');
    }

    await this.tenantDb.db
      .insertInto('segmentMembers')
      .values({ segmentId, companyId: dto.companyId })
      .onConflict((oc) => oc.columns(['segmentId', 'companyId']).doNothing())
      .execute();
  }

  async removeMember(segmentId: string, companyId: string): Promise<void> {
    const segment = await this.get(segmentId);
    if (segment.type !== 'manual') {
      throw new ConflictException('Só é possível remover membros manualmente em segmentos do tipo "manual".');
    }

    await this.tenantDb.db.deleteFrom('segmentMembers').where('segmentId', '=', segmentId).where('companyId', '=', companyId).execute();
  }

  async recomputeSmartSegment(segmentId: string) {
    const segment = await this.get(segmentId);
    if (segment.type !== 'smart') {
      throw new ConflictException('Só segmentos do tipo "smart" podem ser recalculados — segmentos "manual" têm membros geridos à mão.');
    }

    const criteria = this.assertValidCriteria(segment.criteria as Record<string, unknown> | null);
    const companyIds = await this.resolveSmartSegmentCompanyIds(criteria);

    await this.tenantDb.db.deleteFrom('segmentMembers').where('segmentId', '=', segmentId).execute();
    if (companyIds.length > 0) {
      await this.tenantDb.db
        .insertInto('segmentMembers')
        .values(companyIds.map((companyId) => ({ segmentId, companyId })))
        .execute();
    }

    return { segmentId, memberCount: companyIds.length };
  }

  private async resolveSmartSegmentCompanyIds(criteria: SmartSegmentCriteria): Promise<string[]> {
    let query = this.tenantDb.db
      .selectFrom('companies')
      .leftJoin(this.rfm.latestSnapshots().as('latestRfm'), 'latestRfm.companyId', 'companies.id')
      .select('companies.id as companyId')
      .where('companies.workspaceId', '=', this.tenantDb.workspaceId)
      .where('companies.deletedAt', 'is', null);

    if (criteria.industry !== undefined) query = query.where('companies.industry', '=', criteria.industry);
    if (criteria.status !== undefined) query = query.where('companies.status', '=', criteria.status);
    if (criteria.rfmSegment !== undefined) query = query.where('latestRfm.rfmSegment', '=', criteria.rfmSegment);
    if (criteria.monetaryScoreGte !== undefined) query = query.where('latestRfm.monetaryScore', '>=', criteria.monetaryScoreGte);
    if (criteria.frequencyScoreGte !== undefined) query = query.where('latestRfm.frequencyScore', '>=', criteria.frequencyScoreGte);
    if (criteria.recencyScoreGte !== undefined) query = query.where('latestRfm.recencyScore', '>=', criteria.recencyScoreGte);

    const rows = await query.execute();
    return rows.map((r) => r.companyId);
  }
}
