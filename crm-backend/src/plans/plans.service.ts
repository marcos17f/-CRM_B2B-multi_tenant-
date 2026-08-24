import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../db/types';
import { KYSELY_RAW } from '../database/database.constants';
import { TenantDb } from '../database/tenant-db.service';

export type LimitedResource = 'seats' | 'companies' | 'contacts' | 'opportunities';

const LIMIT_COLUMN: Record<LimitedResource, 'maxSeats' | 'maxCompanies' | 'maxContacts' | 'maxOpportunities'> = {
  seats: 'maxSeats',
  companies: 'maxCompanies',
  contacts: 'maxContacts',
  opportunities: 'maxOpportunities',
};

const RESOURCE_LABEL: Record<LimitedResource, string> = {
  seats: 'membros',
  companies: 'empresas',
  contacts: 'contatos',
  opportunities: 'oportunidades',
};

@Injectable()
export class PlansService {
  constructor(
    private readonly tenantDb: TenantDb,
    @Inject(KYSELY_RAW) private readonly rawDb: Kysely<Database>,
  ) {}

  /** Catálogo público de planos (pra tela de preços) — não depende de tenant. */
  listPlans() {
    return this.rawDb.selectFrom('plans').selectAll().where('isActive', '=', true).orderBy('monthlyPriceCents', 'asc').execute();
  }

  private async getWorkspacePlan(workspaceId: string) {
    const workspace = await this.tenantDb.db.selectFrom('workspaces').select('planId').where('id', '=', workspaceId).executeTakeFirstOrThrow();
    return this.rawDb.selectFrom('plans').selectAll().where('id', '=', workspace.planId).executeTakeFirst();
  }

  async currentPlanWithUsage() {
    const plan = await this.getWorkspacePlan(this.tenantDb.workspaceId);
    if (!plan) throw new NotFoundException('Plano do workspace não encontrado.');

    const [seats, companies, contacts, opportunities] = await Promise.all([
      this.countResource('seats'),
      this.countResource('companies'),
      this.countResource('contacts'),
      this.countResource('opportunities'),
    ]);

    return { plan, usage: { seats, companies, contacts, opportunities } };
  }

  async changePlan(planId: string) {
    const plan = await this.rawDb.selectFrom('plans').selectAll().where('id', '=', planId).where('isActive', '=', true).executeTakeFirst();
    if (!plan) throw new NotFoundException(`Plano "${planId}" não encontrado (ou inativo).`);

    return this.tenantDb.db
      .updateTable('workspaces')
      .set({ planId })
      .where('id', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /** Chamado por CompaniesService/ContactsService/OpportunitiesService/MembersService antes de criar. */
  async assertWithinLimit(resource: LimitedResource): Promise<void> {
    const plan = await this.getWorkspacePlan(this.tenantDb.workspaceId);
    if (!plan) return; // sem plano resolvido — não bloqueia (defensivo, não deveria acontecer com o default 'free')

    const limit = plan[LIMIT_COLUMN[resource]];
    if (limit == null) return; // null = ilimitado nesse plano

    const current = await this.countResource(resource);
    if (current >= limit) {
      throw new ForbiddenException(
        `Limite do plano "${plan.name}" atingido: ${limit} ${RESOURCE_LABEL[resource]}. Faça upgrade em PATCH /workspaces/me/plan.`,
      );
    }
  }

  private async countResource(resource: LimitedResource): Promise<number> {
    switch (resource) {
      case 'seats': {
        const row = await this.tenantDb.db
          .selectFrom('workspaceMembers')
          .select((eb) => eb.fn.countAll<string>().as('count'))
          .where('workspaceId', '=', this.tenantDb.workspaceId)
          .where('status', '!=', 'deactivated')
          .executeTakeFirst();
        return Number(row?.count ?? 0);
      }
      case 'companies': {
        const row = await this.tenantDb.db
          .selectFrom('companies')
          .select((eb) => eb.fn.countAll<string>().as('count'))
          .where('workspaceId', '=', this.tenantDb.workspaceId)
          .where('deletedAt', 'is', null)
          .executeTakeFirst();
        return Number(row?.count ?? 0);
      }
      case 'contacts': {
        const row = await this.tenantDb.db
          .selectFrom('contacts')
          .select((eb) => eb.fn.countAll<string>().as('count'))
          .where('workspaceId', '=', this.tenantDb.workspaceId)
          .where('deletedAt', 'is', null)
          .executeTakeFirst();
        return Number(row?.count ?? 0);
      }
      case 'opportunities': {
        const row = await this.tenantDb.db
          .selectFrom('opportunities')
          .select((eb) => eb.fn.countAll<string>().as('count'))
          .where('workspaceId', '=', this.tenantDb.workspaceId)
          .executeTakeFirst();
        return Number(row?.count ?? 0);
      }
    }
  }
}
