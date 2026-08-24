import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDb } from '../database/tenant-db.service';
import type { CreatePipelineDto } from './dto/create-pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(private readonly tenantDb: TenantDb) {}

  async list() {
    const pipelines = await this.tenantDb.db
      .selectFrom('pipelines')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .orderBy('createdAt')
      .execute();

    const stages = await this.tenantDb.db
      .selectFrom('pipelineStages')
      .selectAll()
      .where(
        'pipelineId',
        'in',
        pipelines.map((p) => p.id),
      )
      .orderBy('orderIndex')
      .execute();

    return pipelines.map((pipeline) => ({
      ...pipeline,
      stages: stages.filter((s) => s.pipelineId === pipeline.id),
    }));
  }

  async get(id: string) {
    const pipeline = await this.tenantDb.db
      .selectFrom('pipelines')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado.');

    const stages = await this.tenantDb.db
      .selectFrom('pipelineStages')
      .selectAll()
      .where('pipelineId', '=', id)
      .orderBy('orderIndex')
      .execute();

    return { ...pipeline, stages };
  }

  async create(dto: CreatePipelineDto) {
    const pipeline = await this.tenantDb.db
      .insertInto('pipelines')
      .values({ workspaceId: this.tenantDb.workspaceId, name: dto.name, isDefault: dto.isDefault ?? false })
      .returningAll()
      .executeTakeFirstOrThrow();

    const stages = await this.tenantDb.db
      .insertInto('pipelineStages')
      .values(
        dto.stages.map((s) => ({
          pipelineId: pipeline.id,
          name: s.name,
          orderIndex: s.orderIndex,
          probability: String(s.probability),
          stageType: s.stageType,
        })),
      )
      .returningAll()
      .execute();

    return { ...pipeline, stages };
  }
}
