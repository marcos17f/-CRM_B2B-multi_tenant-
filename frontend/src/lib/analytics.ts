import type { Company, Opportunity, Pipeline, RfmRow } from '@/api/types'

export interface DateRange {
  from: Date
  to: Date
}

export type PeriodPreset = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'last_30_days'

export function presetRange(preset: PeriodPreset): DateRange {
  const now = new Date()
  switch (preset) {
    case 'today': {
      const from = new Date(now)
      from.setHours(0, 0, 0, 0)
      return { from, to: now }
    }
    case 'this_week': {
      const from = new Date(now)
      const day = (from.getDay() + 6) % 7 // segunda = 0
      from.setDate(from.getDate() - day)
      from.setHours(0, 0, 0, 0)
      return { from, to: now }
    }
    case 'this_quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      return { from: new Date(now.getFullYear(), quarterStartMonth, 1), to: now }
    }
    case 'this_month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
    case 'last_30_days':
    default:
      return { from: new Date(now.getTime() - 30 * 86400000), to: now }
  }
}

/** Mesma duração, imediatamente anterior — usado pra "variação % vs período anterior". */
export function previousRange(range: DateRange): DateRange {
  const durationMs = range.to.getTime() - range.from.getTime()
  return { from: new Date(range.from.getTime() - durationMs), to: new Date(range.from.getTime()) }
}

function inRange(dateStr: string | null, range: DateRange): boolean {
  if (!dateStr) return false
  const t = new Date(dateStr).getTime()
  return t >= range.from.getTime() && t <= range.to.getTime()
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null // null = sem base de comparação (evita dividir por zero / número absurdo)
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

export interface Kpis {
  pipelineTotal: number
  activeDeals: number
  conversionRate: number
  wonRevenue: number
  dealsWon: number
  dealsLost: number
}

export function computeKpis(opportunities: Opportunity[], range: DateRange): Kpis {
  const open = opportunities.filter((o) => o.status === 'open')
  const closedInRange = opportunities.filter((o) => o.status !== 'open' && inRange(o.closedAt, range))
  const won = closedInRange.filter((o) => o.status === 'won')
  const lost = closedInRange.filter((o) => o.status === 'lost')
  return {
    pipelineTotal: open.reduce((s, o) => s + Number(o.amount), 0),
    activeDeals: open.length,
    conversionRate: won.length + lost.length > 0 ? Number(((won.length / (won.length + lost.length)) * 100).toFixed(1)) : 0,
    wonRevenue: won.reduce((s, o) => s + Number(o.amount), 0),
    dealsWon: won.length,
    dealsLost: lost.length,
  }
}

export interface PortfolioHealth {
  active: number
  inactive: number
  churned: number
  total: number
  avgLtv: number
}

/**
 * "Ativo" = empresa não-churned com alguma Opportunity atualizada dentro da janela de
 * inatividade (default 90 dias) — aproximação client-side (não olha activities de
 * contatos/company diretamente, só o "último toque" via oportunidades, que é o que já
 * temos em cache). LTV médio vem do snapshot de RFM mais recente de cada company.
 */
export function computePortfolioHealth(
  companies: Company[],
  opportunities: Opportunity[],
  rfmRows: RfmRow[],
  inactivityDays = 90,
): PortfolioHealth {
  const lastTouchByCompany = new Map<string, number>()
  for (const o of opportunities) {
    const t = new Date(o.updatedAt).getTime()
    const prev = lastTouchByCompany.get(o.companyId) ?? 0
    if (t > prev) lastTouchByCompany.set(o.companyId, t)
  }

  const threshold = Date.now() - inactivityDays * 86400000
  let active = 0
  let inactive = 0
  let churned = 0
  for (const c of companies) {
    if (c.status === 'churned') {
      churned++
      continue
    }
    const lastTouch = lastTouchByCompany.get(c.id)
    if (lastTouch && lastTouch >= threshold) active++
    else inactive++
  }

  const avgLtv = rfmRows.length > 0 ? rfmRows.reduce((s, r) => s + Number(r.lifetimeMonetaryTotal), 0) / rfmRows.length : 0

  return { active, inactive, churned, total: companies.length, avgLtv }
}

export interface StageBucket {
  stageId: string
  stageName: string
  orderIndex: number
  count: number
  value: number
}

export function computeFunnel(opportunities: Opportunity[], pipeline: Pipeline | undefined): StageBucket[] {
  if (!pipeline) return []
  const open = opportunities.filter((o) => o.status === 'open' && o.pipelineId === pipeline.id)
  return [...pipeline.stages]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((stage) => {
      const stageOpps = open.filter((o) => o.stageId === stage.id)
      return {
        stageId: stage.id,
        stageName: stage.name,
        orderIndex: stage.orderIndex,
        count: stageOpps.length,
        value: stageOpps.reduce((s, o) => s + Number(o.amount), 0),
      }
    })
}

export interface StalledDeals {
  count: number
  totalValue: number
  deals: Opportunity[]
}

export function computeStalledDeals(opportunities: Opportunity[], thresholdDays: number): StalledDeals {
  const threshold = Date.now() - thresholdDays * 86400000
  const deals = opportunities.filter((o) => o.status === 'open' && new Date(o.updatedAt).getTime() < threshold)
  return { count: deals.length, totalValue: deals.reduce((s, o) => s + Number(o.amount), 0), deals }
}

export interface CycleTime {
  avgDays: number
  fastDays: number
  slowDays: number
}

export function computeCycleTime(opportunities: Opportunity[], range: DateRange): CycleTime {
  const won = opportunities.filter((o) => o.status === 'won' && inRange(o.closedAt, range))
  const days = won.map((o) => (new Date(o.closedAt!).getTime() - new Date(o.createdAt).getTime()) / 86400000)
  if (days.length === 0) return { avgDays: 0, fastDays: 0, slowDays: 0 }
  return {
    avgDays: Math.round(days.reduce((s, d) => s + d, 0) / days.length),
    fastDays: Math.round(Math.min(...days)),
    slowDays: Math.round(Math.max(...days)),
  }
}

export interface RevenueMonth {
  month: string
  label: string
  value: number
}

export function computeRevenueTrend(opportunities: Opportunity[], months = 6): RevenueMonth[] {
  const now = new Date()
  const buckets: RevenueMonth[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.push({ month: key, label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), value: 0 })
  }
  const byMonth = new Map(buckets.map((b) => [b.month, b]))
  for (const o of opportunities) {
    if (o.status !== 'won' || !o.closedAt) continue
    const d = new Date(o.closedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const bucket = byMonth.get(key)
    if (bucket) bucket.value += Number(o.amount)
  }
  return buckets
}

export function topOpenDeals(opportunities: Opportunity[], limit = 5): Opportunity[] {
  return [...opportunities]
    .filter((o) => o.status === 'open')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, limit)
}

export function topLosses(opportunities: Opportunity[], range: DateRange, limit = 5): Opportunity[] {
  return [...opportunities]
    .filter((o) => o.status === 'lost' && inRange(o.closedAt, range))
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, limit)
}

export interface OwnerStat {
  ownerId: string
  dealsWon: number
  dealsManaged: number
  revenue: number
}

export function topOwners(opportunities: Opportunity[], range: DateRange, limit = 5): OwnerStat[] {
  const map = new Map<string, OwnerStat>()
  for (const o of opportunities) {
    if (!o.ownerId) continue
    const relevant = o.status === 'open' || inRange(o.closedAt, range)
    if (!relevant) continue
    const entry = map.get(o.ownerId) ?? { ownerId: o.ownerId, dealsWon: 0, dealsManaged: 0, revenue: 0 }
    entry.dealsManaged++
    if (o.status === 'won') {
      entry.dealsWon++
      entry.revenue += Number(o.amount)
    }
    map.set(o.ownerId, entry)
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}
