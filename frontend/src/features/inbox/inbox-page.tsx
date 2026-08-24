import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, CalendarClock, CheckSquare, Sparkles, ShieldCheck, TrendingUp, Check, X } from 'lucide-react'
import {
  useAiSuggestions,
  useApproveAiSuggestion,
  useCompanies,
  useDismissAiSuggestion,
  useOpportunities,
  useTasks,
} from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, extractErrorMessage } from '@/lib/utils'
import { riskLevelLabel } from '@/lib/labels'

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function InboxPage() {
  const { data: tasks } = useTasks({ status: 'pending' })
  const { data: opportunities } = useOpportunities({ status: 'open' })
  const { data: companies } = useCompanies()
  const { data: aiSuggestions } = useAiSuggestions()
  const dismissSuggestion = useDismissAiSuggestion()
  const approveSuggestion = useApproveAiSuggestion()
  const companyById = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c])), [companies])

  const today = new Date()

  const overdueTasks = useMemo(
    () => (tasks ?? []).filter((t) => t.dueDate && new Date(t.dueDate) < today && !isSameDay(new Date(t.dueDate), today)),
    [tasks], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const todayTasks = useMemo(
    () => (tasks ?? []).filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), today)),
    [tasks], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const riskyOpportunities = useMemo(
    () =>
      (opportunities ?? [])
        .filter((o) => o.riskLevel === 'high' || o.riskLevel === 'medium')
        .sort((a, b) => (a.riskLevel === b.riskLevel ? 0 : a.riskLevel === 'high' ? -1 : 1)),
    [opportunities],
  )

  const upsellOpportunities = useMemo(() => (opportunities ?? []).filter((o) => o.type === 'upsell'), [opportunities])

  const suggestions = useMemo(() => (aiSuggestions ?? []).filter((s) => s.kind === 'suggestion'), [aiSuggestions])
  const approvals = useMemo(() => (aiSuggestions ?? []).filter((s) => s.kind === 'approval'), [aiSuggestions])
  const criticalSuggestions = useMemo(() => suggestions.filter((s) => s.severity === 'critical'), [suggestions])

  const cards = [
    { label: 'Atrasados', value: overdueTasks.length, icon: AlertTriangle, tone: 'text-danger' },
    { label: 'Hoje', value: todayTasks.length, icon: CalendarClock, tone: 'text-warning' },
    { label: 'Sugestões críticas', value: criticalSuggestions.length, icon: Sparkles, tone: 'text-accent-2' },
    { label: 'Aprovações IA', value: approvals.length, icon: ShieldCheck, tone: 'text-accent-2' },
    { label: 'Pendências', value: (tasks ?? []).length, icon: CheckSquare, tone: 'text-text-muted' },
  ]

  function handleDismiss(id: string) {
    dismissSuggestion.mutate(id, { onError: (err) => toast.error(extractErrorMessage(err)) })
  }
  function handleApprove(id: string) {
    approveSuggestion.mutate(id, {
      onSuccess: () => toast.success('Ação aplicada.'),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <div>
      <PageHeader title="Inbox" description="O que precisa da sua atenção agora" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {cards.map(({ label, value, icon: Icon, tone }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-faint">{label}</span>
                  <Icon className={`h-4 w-4 ${tone}`} />
                </div>
                <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Risco
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {riskyOpportunities.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="Nenhuma oportunidade em risco" description="Oportunidades com risco médio ou alto aparecem aqui." />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {riskyOpportunities.map((o) => (
                    <li key={o.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text">{o.name}</p>
                        <p className="text-xs text-text-faint">{companyById.get(o.companyId)?.name ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-faint">{formatCurrency(o.amount, o.currency)}</span>
                        <Badge variant={o.riskLevel === 'high' ? 'danger' : 'warning'}>
                          {riskLevelLabel[o.riskLevel ?? ''] ?? o.riskLevel}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" /> Oportunidades de upsell
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upsellOpportunities.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="Nenhuma oportunidade de upsell agora" />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {upsellOpportunities.map((o) => (
                    <li key={o.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text">{o.name}</p>
                        <p className="text-xs text-text-faint">{companyById.get(o.companyId)?.name ?? '—'}</p>
                      </div>
                      <span className="text-xs text-text-faint">{formatCurrency(o.amount, o.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-2" /> Sugestões IA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {suggestions.length === 0 ? (
                <div className="p-4">
                  <EmptyState icon={Sparkles} title="Nenhuma sugestão agora" description="Heurísticas rodam sobre suas oportunidades a cada carregamento do Inbox." />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {suggestions.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-text">{s.title}</p>
                          <p className="text-xs text-text-faint mt-0.5">{s.description}</p>
                        </div>
                        {s.severity === 'critical' && <Badge variant="danger">Crítica</Badge>}
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button size="sm" variant="ghost" onClick={() => handleDismiss(s.id)} disabled={dismissSuggestion.isPending}>
                          <X className="h-3.5 w-3.5 mr-1" /> Dispensar
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-2" /> Aprovações IA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {approvals.length === 0 ? (
                <div className="p-4">
                  <EmptyState icon={ShieldCheck} title="Nenhuma aprovação pendente" description="Ações que a IA propõe e aguardam sua aprovação aparecem aqui." />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {approvals.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-text">{s.title}</p>
                          <p className="text-xs text-text-faint mt-0.5">{s.description}</p>
                        </div>
                        {s.severity === 'critical' && <Badge variant="danger">Crítica</Badge>}
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button size="sm" variant="ghost" onClick={() => handleDismiss(s.id)} disabled={dismissSuggestion.isPending}>
                          <X className="h-3.5 w-3.5 mr-1" /> Ignorar
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(s.id)} disabled={approveSuggestion.isPending}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-text-faint">
          Quer ver os números do workspace como um todo? Confira a{' '}
          <Link to="/overview" className="text-accent hover:underline">
            Visão Geral
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
