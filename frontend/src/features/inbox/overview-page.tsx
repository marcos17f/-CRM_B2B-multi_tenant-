import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Target,
  TrendingUp,
  RefreshCw,
  MessageCircle,
  UserPlus,
  Timer,
  Reply,
  Bot,
  Sparkles,
  AlertTriangle,
  DollarSign,
} from 'lucide-react'
import {
  useCompanies,
  useContacts,
  useOpportunities,
  usePipelines,
  useRfmList,
  useMessagingMetrics,
} from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PeriodFilter } from '@/components/period-filter'
import { RecentActivityFeed } from '@/components/recent-activity-feed'
import { formatCurrency } from '@/lib/utils'
import {
  presetRange,
  computeKpis,
  computePortfolioHealth,
  computeFunnel,
  computeStalledDeals,
  type PeriodPreset,
} from '@/lib/analytics'
import { useQueryClient } from '@tanstack/react-query'

const ALL_PIPELINES = '__all__'
const STALLED_THRESHOLD_DAYS = 30
const INACTIVITY_THRESHOLD_DAYS = 90

export function OverviewPage() {
  const qc = useQueryClient()
  const [period, setPeriod] = useState<PeriodPreset>('this_month')
  const [pipelineId, setPipelineId] = useState<string>(ALL_PIPELINES)

  const { data: companies, isLoading: loadingCompanies } = useCompanies()
  const { data: contacts, isLoading: loadingContacts } = useContacts()
  const { data: opportunities, isLoading: loadingOpportunities } = useOpportunities()
  const { data: pipelines } = usePipelines()
  const { data: rfmRows } = useRfmList()

  const range = useMemo(() => presetRange(period), [period])
  const { data: messaging, isLoading: loadingMessaging } = useMessagingMetrics(range.from, range.to)

  const isLoading = loadingCompanies || loadingContacts || loadingOpportunities

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
  const portfolio = useMemo(
    () => computePortfolioHealth(companies ?? [], opportunities ?? [], rfmRows ?? [], INACTIVITY_THRESHOLD_DAYS),
    [companies, opportunities, rfmRows],
  )
  const stalled = useMemo(() => computeStalledDeals(scopedOpportunities, STALLED_THRESHOLD_DAYS), [scopedOpportunities])
  const funnel = useMemo(() => computeFunnel(opportunities ?? [], funnelPipeline), [opportunities, funnelPipeline])
  const maxStageValue = Math.max(1, ...funnel.map((s) => s.value))

  const newContacts = useMemo(
    () => (contacts ?? []).filter((c) => new Date(c.createdAt).getTime() >= range.from.getTime()).length,
    [contacts, range],
  )

  const portfolioTotal = Math.max(1, portfolio.total)
  const activePct = (portfolio.active / portfolioTotal) * 100
  const inactivePct = (portfolio.inactive / portfolioTotal) * 100
  const churnedPct = (portfolio.churned / portfolioTotal) * 100

  const kpiCards = [
    { label: 'Pipeline total', value: formatCurrency(kpis.pipelineTotal), icon: DollarSign },
    { label: 'Negócios ativos', value: kpis.activeDeals, icon: Target },
    { label: 'Taxa de conversão', value: `${kpis.conversionRate}%`, icon: TrendingUp },
    { label: 'Receita (ganha)', value: formatCurrency(kpis.wonRevenue), icon: Building2 },
  ]

  return (
    <div>
      <PageHeader
        title="Visão Geral"
        description="Saúde da carteira, pipelines e atendimento em tempo real"
        actions={
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
            <Button size="sm" variant="secondary" onClick={() => qc.invalidateQueries()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            {/* KPIs principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpiCards.map(({ label, value, icon: Icon }) => (
                <Card key={label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-faint">{label}</span>
                      <Icon className="h-4 w-4 text-text-faint" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Saúde da carteira */}
            <Card>
              <CardHeader>
                <CardTitle>Saúde da carteira</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-subtle">
                    <div className="h-full bg-accent" style={{ width: `${activePct}%` }} title={`Ativos: ${portfolio.active}`} />
                    <div className="h-full bg-warning" style={{ width: `${inactivePct}%` }} title={`Inativos: ${portfolio.inactive}`} />
                    <div className="h-full bg-danger" style={{ width: `${churnedPct}%` }} title={`Churn: ${portfolio.churned}`} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-accent" /> Ativos ({portfolio.active})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-warning" /> Inativos ({portfolio.inactive})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-danger" /> Churn ({portfolio.churned})
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <div>
                      <p className="text-xs text-text-faint">Negócios parados (&gt;{STALLED_THRESHOLD_DAYS}d)</p>
                      <p className="text-sm font-medium text-text">
                        {stalled.count} <span className="text-text-faint font-normal">({formatCurrency(stalled.totalValue)})</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-xs text-text-faint">LTV médio</p>
                      <p className="text-sm font-medium text-text">{formatCurrency(portfolio.avgLtv)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance de mensagens */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-accent" /> Performance de mensagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMessaging ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> Enviadas
                      </p>
                      <p className="text-lg font-semibold text-text">{messaging?.messagesSent ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1">
                        <UserPlus className="h-3 w-3" /> Novos contatos
                      </p>
                      <p className="text-lg font-semibold text-text">{newContacts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1">
                        <Timer className="h-3 w-3" /> Tempo 1ª resposta
                      </p>
                      <p className="text-lg font-semibold text-text">
                        {messaging?.firstResponseTimeMinutes != null ? `${messaging.firstResponseTimeMinutes} min` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1">
                        <Reply className="h-3 w-3" /> Taxa de resposta
                      </p>
                      <p className="text-lg font-semibold text-text">{messaging?.responseRate ?? 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-faint">Humano vs. IA</p>
                      <p className="text-lg font-semibold text-text">
                        {messaging?.bySender.human ?? 0} <span className="text-text-faint text-sm">/ {messaging?.bySender.automation ?? 0}</span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agente de IA — reservado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-accent-2" /> Performance do agente de IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <Sparkles className="h-4 w-4 text-accent-2 shrink-0" />
                  Métricas de conversas conduzidas por agente autônomo de IA (taxa de resolução sem intervenção humana,
                  retenção, transbordo) — em breve. Hoje o sistema só sugere ações via heurísticas (Inbox).
                </div>
              </CardContent>
            </Card>

            {/* Funil operacional */}
            {funnelPipeline && (
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline "{funnelPipeline.name}" por etapa</CardTitle>
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

            {/* Feed de atividades recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades recentes</CardTitle>
                <Link to="/activities" className="text-xs text-accent hover:underline">
                  Ver todas as atividades
                </Link>
              </CardHeader>
              <CardContent>
                <RecentActivityFeed limit={15} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
