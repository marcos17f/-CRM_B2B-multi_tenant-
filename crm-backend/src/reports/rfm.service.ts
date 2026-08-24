import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { TenantDb } from '../database/tenant-db.service';

const DEFAULT_PERIOD_MONTHS = 12;

interface RfmRawRow {
  companyId: string;
  lastPurchaseAt: Date;
  recencyDays: number;
  frequencyCount: string;
  monetaryTotal: string;
  lifetimeMonetaryTotal: string;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
}

export type RfmSegment = 'campeoes' | 'fieis' | 'novos' | 'em_risco' | 'perdidos' | 'precisa_atencao';

/**
 * Regra simplificada de mercado (guia RFM seção 1.4) — 5 quintis (1 pior, 5 melhor) por
 * dimensão, combinados num rótulo único. Refine aqui se o negócio pedir mais nuance.
 */
export function resolveRfmSegment(r: number, f: number, m: number): RfmSegment {
  if (r >= 4 && f >= 4 && m >= 4) return 'campeoes';
  if (r <= 2 && f >= 3 && m >= 3) return 'em_risco';
  if (r <= 2 && f <= 2 && m <= 2) return 'perdidos';
  if (r >= 4 && f <= 2) return 'novos';
  if (r >= 3 && f >= 3) return 'fieis';
  return 'precisa_atencao';
}

export interface ListRfmFilters {
  segment?: string;
  sortBy?: 'recency' | 'frequency' | 'monetary' | 'name';
  order?: 'asc' | 'desc';
}

@Injectable()
export class RfmService {
  constructor(private readonly tenantDb: TenantDb) {}

  /**
   * Recalcula o snapshot de RFM de todas as companies do workspace que tiveram pelo menos
   * uma Opportunity `won` dentro da janela de `periodMonths`. Empresas sem compra no
   * período ficam de fora do snapshot (não aparecem em GET /reports/rfm) — mais simples
   * que dar score mínimo artificial pra quem nunca comprou.
   */
  async recompute(periodMonths: number = DEFAULT_PERIOD_MONTHS) {
    const workspaceId = this.tenantDb.workspaceId;

    const rows = await sql<RfmRawRow>`
      with raw_metrics as (
        select
          company_id,
          max(closed_at) filter (where closed_at >= now() - (${periodMonths}::int * interval '1 month')) as last_purchase_at,
          count(*) filter (where closed_at >= now() - (${periodMonths}::int * interval '1 month')) as frequency_count,
          coalesce(sum(amount) filter (where closed_at >= now() - (${periodMonths}::int * interval '1 month')), 0) as monetary_total,
          coalesce(sum(amount), 0) as lifetime_monetary_total
        from opportunities
        where workspace_id = ${workspaceId} and status = 'won'
        group by company_id
        having count(*) filter (where closed_at >= now() - (${periodMonths}::int * interval '1 month')) > 0
      )
      select
        company_id,
        last_purchase_at,
        extract(day from now() - last_purchase_at)::int as recency_days,
        frequency_count,
        monetary_total,
        lifetime_monetary_total,
        ntile(5) over (order by last_purchase_at asc)  as recency_score,
        ntile(5) over (order by frequency_count asc)   as frequency_score,
        ntile(5) over (order by monetary_total asc)    as monetary_score
      from raw_metrics
    `.execute(this.tenantDb.db);

    const computedAt = new Date();

    if (rows.rows.length > 0) {
      await this.tenantDb.db
        .insertInto('customerRfmSnapshots')
        .values(
          rows.rows.map((row) => ({
            workspaceId,
            companyId: row.companyId,
            computedAt,
            periodMonths,
            lastPurchaseAt: row.lastPurchaseAt,
            recencyDays: row.recencyDays,
            frequencyCount: Number(row.frequencyCount),
            monetaryTotal: row.monetaryTotal,
            lifetimeMonetaryTotal: row.lifetimeMonetaryTotal,
            recencyScore: row.recencyScore,
            frequencyScore: row.frequencyScore,
            monetaryScore: row.monetaryScore,
            rfmSegment: resolveRfmSegment(row.recencyScore, row.frequencyScore, row.monetaryScore),
          })),
        )
        .execute();
    }

    return { computedAt, periodMonths, companiesScored: rows.rows.length };
  }

  /** Snapshot mais recente de cada company — reaproveitado por SegmentsService (critério "smart"). */
  latestSnapshots() {
    return this.latestSnapshotsQuery();
  }

  /** CTE reaproveitada por listLatest/topCustomers: o snapshot mais recente de cada company. */
  private latestSnapshotsQuery() {
    return this.tenantDb.db
      .selectFrom('customerRfmSnapshots')
      .distinctOn('companyId')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .orderBy('companyId')
      .orderBy('computedAt', 'desc');
  }

  async listLatest(filters: ListRfmFilters) {
    let query = this.tenantDb.db
      .with('latestRfm', () => this.latestSnapshotsQuery())
      .selectFrom('latestRfm')
      .innerJoin('companies', 'companies.id', 'latestRfm.companyId')
      .select([
        'companies.id as companyId',
        'companies.name as companyName',
        'companies.status as companyStatus',
        'latestRfm.computedAt',
        'latestRfm.periodMonths',
        'latestRfm.lastPurchaseAt',
        'latestRfm.recencyDays',
        'latestRfm.frequencyCount',
        'latestRfm.monetaryTotal',
        'latestRfm.lifetimeMonetaryTotal',
        'latestRfm.recencyScore',
        'latestRfm.frequencyScore',
        'latestRfm.monetaryScore',
        'latestRfm.rfmSegment',
      ]);

    if (filters.segment) query = query.where('latestRfm.rfmSegment', '=', filters.segment);

    const order = filters.order ?? 'desc';
    const sortColumn = {
      recency: 'latestRfm.recencyScore' as const,
      frequency: 'latestRfm.frequencyScore' as const,
      monetary: 'latestRfm.monetaryScore' as const,
      name: 'companies.name' as const,
    }[filters.sortBy ?? 'monetary'];

    return query.orderBy(sortColumn, order).execute();
  }

  getCompanyHistory(companyId: string) {
    return this.tenantDb.db
      .selectFrom('customerRfmSnapshots')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('companyId', '=', companyId)
      .orderBy('computedAt', 'desc')
      .execute();
  }

  /**
   * Priorização/LTV (guia seção 3) — ranking por valor, com o "% do faturamento" que esse
   * grupo representa (o número que costuma abrir os olhos: "top 20% = X% do faturamento").
   */
  async topCustomers(limit: number, useLifetime: boolean) {
    const valueColumn = useLifetime ? ('latestRfm.lifetimeMonetaryTotal' as const) : ('latestRfm.monetaryTotal' as const);
    const valueKey = useLifetime ? 'lifetimeMonetaryTotal' : 'monetaryTotal';

    const top = await this.tenantDb.db
      .with('latestRfm', () => this.latestSnapshotsQuery())
      .selectFrom('latestRfm')
      .innerJoin('companies', 'companies.id', 'latestRfm.companyId')
      .select(['companies.id as companyId', 'companies.name as companyName', valueColumn])
      .orderBy(valueColumn, 'desc')
      .limit(limit)
      .execute();

    const totals = await this.tenantDb.db
      .with('latestRfm', () => this.latestSnapshotsQuery())
      .selectFrom('latestRfm')
      .select((eb) => eb.fn.sum<string>(valueColumn).as('total'))
      .executeTakeFirst();

    const totalRevenue = Number(totals?.total ?? 0);
    const topRevenue = top.reduce((sum, row) => sum + Number((row as Record<string, unknown>)[valueKey]), 0);

    return {
      periodBasis: useLifetime ? 'lifetime' : 'last_snapshot_window',
      totalRevenue,
      topRevenue,
      percentOfTotalRevenue: totalRevenue > 0 ? Number(((topRevenue / totalRevenue) * 100).toFixed(2)) : 0,
      customers: top,
    };
  }
}
