import { Injectable, NotFoundException } from '@nestjs/common';
import type { Updateable } from 'kysely';
import type { CompaniesTable } from '../../db/types';
import { TenantDb } from '../database/tenant-db.service';
import { PlansService } from '../plans/plans.service';
import type { CreateCompanyDto } from './dto/create-company.dto';
import type { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly plans: PlansService,
  ) {}

  list() {
    return this.tenantDb.db
      .selectFrom('companies')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  async get(id: string) {
    const company = await this.tenantDb.db
      .selectFrom('companies')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    if (!company) throw new NotFoundException('Empresa não encontrada.');
    return company;
  }

  async create(dto: CreateCompanyDto) {
    await this.plans.assertWithinLimit('companies');

    return this.tenantDb.db
      .insertInto('companies')
      .values({
        workspaceId: this.tenantDb.workspaceId,
        name: dto.name,
        domain: dto.domain ?? null,
        industry: dto.industry ?? null,
        employeeCount: dto.employeeCount ?? null,
        annualRevenue: dto.annualRevenue !== undefined ? String(dto.annualRevenue) : null,
        status: dto.status ?? 'prospect',
        ownerId: dto.ownerId ?? this.tenantDb.workspaceMemberId,
        customFields: dto.customFields ?? {},
        createdBy: this.tenantDb.workspaceMemberId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.get(id); // garante 404 se não existir/não for deste tenant

    const values: Updateable<CompaniesTable> = {};
    if (dto.name !== undefined) values.name = dto.name;
    if (dto.domain !== undefined) values.domain = dto.domain;
    if (dto.industry !== undefined) values.industry = dto.industry;
    if (dto.employeeCount !== undefined) values.employeeCount = dto.employeeCount;
    if (dto.annualRevenue !== undefined) values.annualRevenue = String(dto.annualRevenue);
    if (dto.status !== undefined) values.status = dto.status;
    if (dto.ownerId !== undefined) values.ownerId = dto.ownerId;
    if (dto.customFields !== undefined) values.customFields = dto.customFields;

    return this.tenantDb.db
      .updateTable('companies')
      .set(values)
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.tenantDb.db
      .updateTable('companies')
      .set({ deletedAt: new Date() })
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .execute();
  }
}
