import { toast } from 'sonner'
import { Workflow } from 'lucide-react'
import { useSetWorkflowEnabled, useWorkflows } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { PermissionGate } from '@/components/permission-gate'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { extractErrorMessage } from '@/lib/utils'

export function OperationsPage() {
  const { data: workflows, isLoading } = useWorkflows()
  const setEnabled = useSetWorkflowEnabled()

  return (
    <div>
      <PageHeader title="Operações" description="Automações fixas do workspace" />

      <div className="p-6 max-w-2xl space-y-3">
        {isLoading && <Skeleton className="h-24 w-full" />}

        {!isLoading && (workflows?.length ?? 0) === 0 && (
          <EmptyState icon={Workflow} title="Nenhuma automação disponível" />
        )}

        {!isLoading &&
          workflows?.map((w) => (
            <Card key={w.key}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-text">{w.name}</p>
                  <p className="text-sm text-text-muted mt-0.5">{w.description}</p>
                </div>
                <PermissionGate permission="workspace:manage">
                  <Switch
                    checked={w.enabled}
                    onCheckedChange={(checked) =>
                      setEnabled.mutate(
                        { key: w.key, enabled: checked },
                        { onError: (err) => toast.error(extractErrorMessage(err)) },
                      )
                    }
                    disabled={setEnabled.isPending}
                  />
                </PermissionGate>
              </CardContent>
            </Card>
          ))}

        <p className="text-xs text-text-faint pt-2">
          Motor genérico de regras configuráveis (trigger + condição + ação customizados) ainda não existe —
          essas são automações fixas embutidas no backend que você só pode ligar ou desligar.
        </p>
      </div>
    </div>
  )
}
