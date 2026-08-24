import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, Download, Target as TargetIcon, TrendingUp, Timer, Trophy } from 'lucide-react'
import {
  useCompanies,
  useContacts,
  useMembers,
  useOpportunities,
  usePipelines,
  useRfmList,
} from '@/hooks/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/empty-state'
import { PeriodFilter } from '@/components/period-filter'
import { formatCurrency } from '@/lib/utils'
import {
  presetRange,
  previousRange,
  percentChange,
  computeKpis,
  computePortfolioHealth,
  computeFunnel,
  computeStalledDeals,
  computeCycleTime,
  computeRevenueTrend,
  topOpenDeals,
  topLosses,
  topOwners,
  type PeriodPreset,
} from '@/lib/analytics'

const ALL_PIPELINES = '__all__'
const STALLED_THRESHOLD_DAYS = 10

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const positive = pct >= 0
  return (
    <span className={`text-xs font-medium ${positive ? 'text-accent' : 'text-danger'}`}>
      {positive ? '+' : ''}
      {pct}% vs. período anterior
    </span>
  )
}

export function PerformanceTab() {
  const [period, setPeriod] = useState<PeriodPreset>('this_month')
  const [pipelineId, setPipelineId] = useState<string>(ALL_PIPELINES)

  const { data: opportunities, isLoading } = useOpportunities()
  const { data: pipelines } = usePipelines()
  const { data: companies } = useCompanies()
  const { data: contacts } = useContacts()
  const { data: members } = useMembers()
  const { data: rfmRows } = useRfmList()

  const range = useMemo(() => presetRange(period), [period])
  const prevRange = useMemo(() => previousRange(range), [range])

  const selectedPipeline = useMemo(
    () => (pipelineId === ALL_PIPELINES ? undefined : pipelines?.find((p) => p.id === pipelineId)),
    [pipelines, pipelineId],
  )
  const defaultPipeline = useMemo(() => pipelines?.find((p) => p.isDefault) ?? pipelines?.[0], [pipelines])
  const funnelPipeline = selectedPipeline ?? defaultPipeline

  const scopedOpportunities = useMemo(
    () => (pipelineId === ALL_PIPELINES ? (opportunities ?? []) : (opportunities ?? []).filter((o) => o.pipelineId === pipelineId)),
    [opportunities, pipelineId],
  )

  const kpis = useMemo(() => computeKpis(scopedOpportunities, range), [scopedOpportunities, range])
  const prevKpis = useMemo(() => computeKpis(scopedOpportunities, prevRange), [scopedOpportunities, prevRange])
  const cycle = useMemo(() => computeCycleTime(scopedOpportunities, range), [scopedOpportunities, range])
  const funnel = useMemo(() => computeFunnel(opportunities ?? [], funnelPipeline), [opportunities, funnelPipeline])
  const maxStageValue = Math.max(1, ...funnel.map((s) => s.value))
  const revenueTrend = useMemo(() => computeRevenueTrend(scopedOpportunities, 6), [scopedOpportunities])
  const maxRevenue = Math.max(1, ...revenueTrend.map((m) => m.value))
  const portfolio = useMemo(
    () => computePortfolioHealth(companies ?? [], opportunities ?? [], rfmRows ?? [], 90),
    [companies, opportunities, rfmRows],
  )
  const stalled = useMemo(() => computeStalledDeals(scopedOpportunities, STALLED_THRESHOLD_DAYS), [scopedOpportunities])
  const losses = useMemo(() => topLosses(scopedOpportunities, range, 5), [scopedOpportunities, range])
  const openDeals = useMemo(() => topOpenDeals(scopedOpportunities, 5), [scopedOpportunities])
  const owners = useMemo(() => topOwners(scopedOpportunities, range, 5), [scopedOpportunities, range])

  const companyNameById = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c.name])), [companies])
  const contactNameById = useMemo(
    () => new Map((contacts ?? []).map((c) => [c.id, `${c.firstName} ${c.lastName ?? ''}`.trim()])),
    [contacts],
  )
  const memberNameById = useMemo(() => new Map((members ?? []).map((m) => [m.id, m.name])), [members])

  const portfolioTotal = Math.max(1, portfolio.total)

  function handleExport() {
    toast.info('Gerando PDF via impressão do navegador — escolha "Salvar como PDF" na janela de impressão.')
    setTimeout(() => window.print(), 300)
  }

  if (isLoading) return null

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div className="flex items-center gap-2">
          <Select value={pipelineId} onValueChange={setPipelineId}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PIPELINES}>Todos os pipelines</SelectItem>
              {(pipelines ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
        <Button size="sm" variant="secondary" onClick={handleExport}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Exportar PDF
        </Button>
      </div>

      <div className="rounded-md border border-dashed border-border bg-bg-subtle px-4 py-3 flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <TargetIcon className="h-4 w-4 text-accent-2" />
          Configure metas por pipeline pra habilitar projeções de forecast aqui.
        </div>
        <Button size="sm" variant="ghost" disabled title="Metas ainda não implementadas">
          Configurar meta
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-text-faint">Pipeline total</span>
            <p className="mt-2 text-2xl font-semibold text-text">{formatCurrency(kpis.pipelineTotal)}</p>
            <p className="text-xs text-text-faint mt-1">Snapshot atual — sem comparação histórica</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-text-faint">Win rate</span>
            <p className="mt-2 text-2xl font-semibold text-text">{kpis.conversionRate}%</p>
            <ChangeBadge pct={percentChange(kpis.conversionRate, prevKpis.conversionRate)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-text-faint flex items-center gap-1">
              <Timer className="h-3 w-3" /> Ciclo médio
            </span>
            <p className="mt-2 text-2xl font-semibold text-text">{cycle.avgDays}d</p>
            <p className="text-xs text-text-faint mt-1">
              rápido {cycle.fastDays}d · lento {cycle.slowDays}d
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-text-faint">Deals fechados</span>
            <p className="mt-2 text-2xl font-semibold text-text">
              <span className="text-accent">{kpis.dealsWon}</span>
              <span className="text-text-faint"> / </span>
              <span className="text-danger">{kpis.dealsLost}</span>
            </p>
            <p className="text-xs text-text-faint mt-1">ganhos / perdidos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funil */}
        {funnelPipeline && (
          <Card>
            <CardHeader>
              <CardTitle>Funil — {funnelPipeline.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funnel.map((s) => (
                <div key={s.stageId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text">
                      {s.stageName} <span className="text-text-faint">({s.count})</span>
                    </span>
                    <span className="text-text-muted">{formatCurrency(s.value)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-bg-subtle overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(s.value / maxStageValue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tendência de receita */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Tendência de receita (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {revenueTrend.map((m) => (
                <div key={m.month} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                  <div
                    className="w-full rounded-t bg-accent min-h-[2px]"
                    style={{ height: `${(m.value / maxRevenue) * 100}%` }}
                    title={formatCurrency(m.value)}
                  />
                  <span className="text-[10px] text-text-faint">{m.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Saúde da carteira */}
        <Card>
          <CardHeader>
            <CardTitle>Saúde da carteira</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-text-faint">LTV médio</p>
              <p className="text-lg font-semibold text-text">{formatCurrency(portfolio.avgLtv)}</p>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-subtle">
              <div className="h-full bg-accent" style={{ width: `${(portfolio.active / portfolioTotal) * 100}%` }} />
              <div className="h-full bg-warning" style={{ width: `${(portfolio.inactive / portfolioTotal) * 100}%` }} />
              <div className="h-full bg-danger" style={{ width: `${(portfolio.churned / portfolioTotal) * 100}%` }} />
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span>Ativos {((portfolio.active / portfolioTotal) * 100).toFixed(0)}%</span>
              <span>Inativos {((portfolio.inactive / portfolioTotal) * 100).toFixed(0)}%</span>
              <span>Churn {((portfolio.churned / portfolioTotal) * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Risco de estagnação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Risco de estagnação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-faint">Deals sem evolução &gt;{STALLED_THRESHOLD_DAYS}d</p>
              <p className="text-2xl font-semibold text-text">{stalled.count}</p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Valor em risco</p>
              <p className="text-2xl font-semibold text-danger">{formatCurrency(stalled.totalValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Principais perdas */}
        <Card>
          <CardHeader>
            <CardTitle>Principais perdas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {losses.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Nenhuma perda no período" />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {losses.map((o) => (
                  <li key={o.id} className="px-4 py-2.5">
                    <Link to={`/companies/${o.companyId}`} className="text-sm font-medium text-text hover:text-accent">
                      {o.name}
                    </Link>
                    <p className="text-xs text-text-faint">{o.lostReason ?? 'Sem motivo registrado'}</p>
                    <p className="text-xs text-danger mt-0.5">{formatCurrency(o.amount, o.currency)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top deals abertos */}
        <Card>
          <CardHeader>
            <CardTitle>Top deals em aberto</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {openDeals.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Nenhum deal aberto" />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {openDeals.map((o) => (
                  <li key={o.id} className="px-4 py-2.5">
                    <p className="text-sm font-medium text-text">{o.name}</p>
                    <p className="text-xs text-text-faint">
                      {companyNameById.get(o.companyId) ?? '—'}
                      {o.primaryContactId ? ` · ${contactNameById.get(o.primaryContactId) ?? ''}` : ''}
                    </p>
                    <p className="text-xs text-accent mt-0.5">{formatCurrency(o.amount, o.currency)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top vendedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" /> Top vendedores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {owners.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Sem dados no período" />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {owners.map((o, i) => (
                  <li key={o.ownerId} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {i + 1}º {memberNameById.get(o.ownerId) ?? 'Sem dono'}
                      </p>
                      <p className="text-xs text-text-faint">
                        {o.dealsWon} ganhos · {o.dealsManaged} gerenciados
                      </p>
                    </div>
                    <span className="text-sm text-accent">{formatCurrency(o.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
