import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'kysely';
import { ActivitiesService } from '../activities/activities.service';
import { TenantDb } from '../database/tenant-db.service';

const STALE_CRITICAL_DAYS = 7;
const STALE_APPROVAL_DAYS = 10;

const RULE_STALE_CRITICAL = 'stale_opportunity_critical';
const RULE_STALE_RISK_APPROVAL = 'stale_opportunity_risk_approval';

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * "Agentes de IA" — primeira fatia, sem chamada real a um modelo de linguagem: as
 * sugestões vêm de heurísticas de negócio determinísticas sobre dados que já existem
 * (oportunidades sem atividade recente). Zero custo de API, zero chave necessária,
 * resultado sempre explicável. Ver db/migrations/007_ai_suggestions.sql para o porquê do
 * modelo de dados (upsert idempotente por rule_key).
 */
@Injectable()
export class AiService {
  constructor(
    private readonly tenantDb: TenantDb,
    private readonly activities: ActivitiesService,
  ) {}

  async list() {
    await this.refreshSuggestions();

    return this.tenantDb.db
      .selectFrom('aiSuggestions')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('status', '=', 'pending')
      .orderBy(sql`case when severity = 'critical' then 0 else 1 end`)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async dismiss(id: string) {
    const suggestion = await this.get(id);
    if (suggestion.status !== 'pending') throw new ConflictException('Essa sugestão já foi resolvida.');

    return this.tenantDb.db
      .updateTable('aiSuggestions')
      .set({ status: 'dismissed', resolvedAt: new Date() })
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async approve(id: string) {
    const suggestion = await this.get(id);
    if (suggestion.kind !== 'approval') throw new BadRequestException('Só sugestões do tipo aprovação podem ser aprovadas — as demais são só informativas (use dismiss).');
    if (suggestion.status !== 'pending') throw new ConflictException('Essa sugestão já foi resolvida.');

    const payload = suggestion.payload as { proposedRiskLevel?: string };

    if (suggestion.relatedToType === 'opportunity' && payload.proposedRiskLevel) {
      await this.tenantDb.db
        .updateTable('opportunities')
        .set({ riskLevel: payload.proposedRiskLevel })
        .where('id', '=', suggestion.relatedToId)
        .where('workspaceId', '=', this.tenantDb.workspaceId)
        .where('status', '=', 'open')
        .execute();

      await this.activities.log({
        type: 'system',
        relatedToType: 'opportunity',
        relatedToId: suggestion.relatedToId,
        payload: { event: 'ai_suggestion_approved', suggestionId: suggestion.id, appliedRiskLevel: payload.proposedRiskLevel },
        actorId: null,
      });
    }

    return this.tenantDb.db
      .updateTable('aiSuggestions')
      .set({ status: 'approved', resolvedAt: new Date() })
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  private async get(id: string) {
    const row = await this.tenantDb.db
      .selectFrom('aiSuggestions')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .executeTakeFirst();
    if (!row) throw new NotFoundException('Sugestão não encontrada.');
    return row;
  }

  /**
   * Recalcula as heurísticas e sincroniza a tabela: cria sugestões novas (idempotente via
   * unique index parcial), e auto-resolve (dismissed) as que deixaram de valer — sem
   * precisar de cron/fila, roda a cada GET.
   */
  private async refreshSuggestions() {
    const workspaceId = this.tenantDb.workspaceId;

    // Oportunidades fechadas não devem manter sugestões pendentes.
    await this.tenantDb.db
      .updateTable('aiSuggestions as s')
      .set({ status: 'dismissed', resolvedAt: new Date() })
      .where('s.workspaceId', '=', workspaceId)
      .where('s.status', '=', 'pending')
      .where('s.relatedToType', '=', 'opportunity')
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('opportunities as o')
              .select('o.id')
              .whereRef('o.id', '=', 's.relatedToId')
              .where('o.status', '=', 'open'),
          ),
        ),
      )
      .execute();

    const openOpportunities = await this.tenantDb.db
      .selectFrom('opportunities')
      .select(['id', 'name', 'riskLevel', 'createdAt'])
      .where('workspaceId', '=', workspaceId)
      .where('status', '=', 'open')
      .execute();

    if (openOpportunities.length === 0) return;

    const latestActivities = await this.tenantDb.db
      .selectFrom('activities')
      .select(['relatedToId', sql<Date>`max(occurred_at)`.as('lastAt')])
      .where('workspaceId', '=', workspaceId)
      .where('relatedToType', '=', 'opportunity')
      .where(
        'relatedToId',
        'in',
        openOpportunities.map((o) => o.id),
      )
      .groupBy('relatedToId')
      .execute();
    const lastActivityById = new Map(latestActivities.map((a) => [a.relatedToId, new Date(a.lastAt)]));

    for (const opportunity of openOpportunities) {
      const lastActivityAt = lastActivityById.get(opportunity.id) ?? opportunity.createdAt;
      const days = daysSince(lastActivityAt);

      await this.syncRule({
        ruleKey: RULE_STALE_CRITICAL,
        applies: days >= STALE_CRITICAL_DAYS,
        opportunityId: opportunity.id,
        insert: {
          kind: 'suggestion',
          severity: 'critical',
          title: 'Sem atividade recente',
          description: `"${opportunity.name}" está há ${days} dias sem nenhuma atividade registrada.`,
          payload: { days },
        },
      });

      await this.syncRule({
        ruleKey: RULE_STALE_RISK_APPROVAL,
        applies: days >= STALE_APPROVAL_DAYS && opportunity.riskLevel !== 'high',
        opportunityId: opportunity.id,
        insert: {
          kind: 'approval',
          severity: 'critical',
          title: 'Marcar risco como alto?',
          description: `"${opportunity.name}" está há ${days} dias sem atividade e ainda não está marcada como risco alto.`,
          payload: { days, proposedRiskLevel: 'high', currentRiskLevel: opportunity.riskLevel },
        },
      });
    }
  }

  private async syncRule(params: {
    ruleKey: string;
    applies: boolean;
    opportunityId: string;
    insert: { kind: string; severity: string; title: string; description: string; payload: Record<string, unknown> };
  }) {
    const workspaceId = this.tenantDb.workspaceId;

    if (params.applies) {
      await this.tenantDb.db
        .insertInto('aiSuggestions')
        .values({
          workspaceId,
          kind: params.insert.kind,
          ruleKey: params.ruleKey,
          relatedToType: 'opportunity',
          relatedToId: params.opportunityId,
          severity: params.insert.severity,
          title: params.insert.title,
          description: params.insert.description,
          payload: params.insert.payload,
        })
        .onConflict((oc) =>
          oc.columns(['workspaceId', 'ruleKey', 'relatedToType', 'relatedToId']).where('status', '=', 'pending').doNothing(),
        )
        .execute();
    } else {
      await this.tenantDb.db
        .updateTable('aiSuggestions')
        .set({ status: 'dismissed', resolvedAt: new Date() })
        .where('workspaceId', '=', workspaceId)
        .where('ruleKey', '=', params.ruleKey)
        .where('relatedToId', '=', params.opportunityId)
        .where('status', '=', 'pending')
        .execute();
    }
  }
}
