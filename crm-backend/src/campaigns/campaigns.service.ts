import { Injectable, NotFoundException } from '@nestjs/common';
import type { Updateable } from 'kysely';
import type { CampaignsTable } from '../../db/types';
import { TenantDb } from '../database/tenant-db.service';
import type { CreateCampaignDto } from './dto/create-campaign.dto';
import type { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly tenantDb: TenantDb) {}

  list() {
    return this.tenantDb.db
      .selectFrom('campaigns')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  async get(id: string) {
    const campaign = await this.tenantDb.db
      .selectFrom('campaigns')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!campaign) throw new NotFoundException('Campanha não encontrada.');
    return campaign;
  }

  create(dto: CreateCampaignDto) {
    return this.tenantDb.db
      .insertInto('campaigns')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        name: dto.name,
        type: dto.type,
        status: dto.status ?? 'active',
        ownerId: dto.ownerId ?? this.tenantDb.workspaceMemberId,
        startsAt: dto.startsAt ?? null,
        endsAt: dto.endsAt ?? null,
        budget: dto.budget !== undefined ? String(dto.budget) : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.get(id);

    const values: Updateable<CampaignsTable> = {};
    if (dto.name !== undefined) values.name = dto.name;
    if (dto.type !== undefined) values.type = dto.type;
    if (dto.status !== undefined) values.status = dto.status;
    if (dto.ownerId !== undefined) values.ownerId = dto.ownerId;
    if (dto.startsAt !== undefined) values.startsAt = dto.startsAt;
    if (dto.endsAt !== undefined) values.endsAt = dto.endsAt;
    if (dto.budget !== undefined) values.budget = String(dto.budget);

    return this.tenantDb.db
      .updateTable('campaigns')
      .set(values)
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
