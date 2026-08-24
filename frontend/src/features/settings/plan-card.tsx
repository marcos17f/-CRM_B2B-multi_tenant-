import { toast } from 'sonner'
import { CreditCard } from 'lucide-react'
import { useCurrentPlan, usePlans, useChangePlan } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { extractErrorMessage } from '@/lib/utils'

function formatPrice(cents: number | null) {
  if (cents === null) return 'Sob consulta'
  if (cents === 0) return 'Grátis'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100) + '/mês'
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-text-muted mb-1">
        <span>{label}</span>
        <span>
          {used} / {limit ?? '∞'}
        </span>
      </div>
      {limit && (
        <div className="h-1.5 w-full rounded-full bg-surface-hover overflow-hidden">
          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

export function PlanCard() {
  const { data: current, isLoading } = useCurrentPlan()
  const { data: plans } = usePlans()
  const changePlan = useChangePlan()

  function handleChange(planId: string) {
    changePlan.mutate(planId, {
      onSuccess: () => toast.success('Plano atualizado.'),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Plano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="h-32 w-full" />}
        {!isLoading && current && (
          <>
            <div>
              <p className="text-sm font-medium text-text">{current.plan.name}</p>
              <p className="text-xs text-text-faint">{formatPrice(current.plan.monthlyPriceCents)}</p>
            </div>
            <div className="space-y-2">
              <UsageBar label="Assentos" used={current.usage.seats} limit={current.plan.maxSeats} />
              <UsageBar label="Empresas" used={current.usage.companies} limit={current.plan.maxCompanies} />
              <UsageBar label="Contatos" used={current.usage.contacts} limit={current.plan.maxContacts} />
              <UsageBar label="Oportunidades" used={current.usage.opportunities} limit={current.plan.maxOpportunities} />
            </div>
            <PermissionGate permission="workspace:manage">
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-xs text-text-faint">Trocar plano</p>
                <div className="flex flex-wrap gap-2">
                  {(plans ?? []).map((p) => (
                    <Button
                      key={p.id}
                      size="sm"
                      variant={p.id === current.plan.id ? 'default' : 'secondary'}
                      disabled={p.id === current.plan.id || changePlan.isPending}
                      onClick={() => handleChange(p.id)}
                    >
                      {p.name}
                    </Button>
                  ))}
                </div>
                <p className="text-[11px] text-text-faint">Sem cobrança real integrada — troca de plano é self-service.</p>
              </div>
            </PermissionGate>
          </>
        )}
      </CardContent>
    </Card>
  )
}
