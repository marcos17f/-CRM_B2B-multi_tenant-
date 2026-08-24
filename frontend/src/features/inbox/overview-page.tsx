import { useMemo } from 'react'
import { Building2, Users, Target, Megaphone } from 'lucide-react'
import { useCampaigns, useCompanies, useContacts, useOpportunities, usePipelines } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'

export function OverviewPage() {
  const { data: companies, isLoading: loadingCompanies } = useCompanies()
  const { data: contacts, isLoading: loadingContacts } = useContacts()
  const { data: opportunities, isLoading: loadingOpportunities } = useOpportunities()
  const { data: campaigns } = useCampaigns()
  const { data: pipelines } = usePipelines()

  const isLoading = loadingCompanies || loadingContacts || loadingOpportunities

  const openOpportunities = useMemo(() => (opportunities ?? []).filter((o) => o.status === 'open'), [opportunities])
  const wonOpportunities = useMemo(() => (opportunities ?? []).filter((o) => o.status === 'won'), [opportunities])
  const openPipelineValue = useMemo(() => openOpportunities.reduce((sum, o) => sum + Number(o.amount), 0), [openOpportunities])
  const wonValue = useMemo(() => wonOpportunities.reduce((sum, o) => sum + Number(o.amount), 0), [wonOpportunities])
  const activeCampaigns = useMemo(() => (campaigns ?? []).filter((c) => c.status === 'active').length, [campaigns])

  const defaultPipeline = useMemo(() => pipelines?.find((p) => p.isDefault) ?? pipelines?.[0], [pipelines])
  const stageBreakdown = useMemo(() => {
    if (!defaultPipeline) return []
    return [...defaultPipeline.stages]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((stage) => {
        const stageOpportunities = openOpportunities.filter((o) => o.stageId === stage.id)
        return {
          stage,
          count: stageOpportunities.length,
          value: stageOpportunities.reduce((sum, o) => sum + Number(o.amount), 0),
        }
      })
  }, [defaultPipeline, openOpportunities])

  const maxStageValue = Math.max(1, ...stageBreakdown.map((s) => s.value))

  const summaryCards = [
    { label: 'Empresas', value: companies?.length ?? 0, icon: Building2 },
    { label: 'Contatos', value: contacts?.length ?? 0, icon: Users },
    { label: 'Oportunidades abertas', value: openOpportunities.length, icon: Target },
    { label: 'Campanhas ativas', value: activeCampaigns, icon: Megaphone },
  ]

  return (
    <div>
      <PageHeader title="Visão Geral" description="Números consolidados do workspace" />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {summaryCards.map(({ label, value, icon: Icon }) => (
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Valor em aberto no pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-accent">{formatCurrency(openPipelineValue)}</p>
                  <p className="text-xs text-text-faint mt-1">{openOpportunities.length} oportunidades abertas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Valor ganho</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-text">{formatCurrency(wonValue)}</p>
                  <p className="text-xs text-text-faint mt-1">{wonOpportunities.length} oportunidades ganhas</p>
                </CardContent>
              </Card>
            </div>

            {defaultPipeline && (
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline "{defaultPipeline.name}" por estágio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stageBreakdown.map(({ stage, count, value }) => (
                    <div key={stage.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-text">
                          {stage.name} <span className="text-text-faint">({count})</span>
                        </span>
                        <span className="text-text-muted">{formatCurrency(value)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-bg-subtle overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(value / maxStageValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
