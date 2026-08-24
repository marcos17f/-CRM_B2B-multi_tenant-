import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, Building2 } from 'lucide-react'
import { useCompany, useContacts, useDeleteCompany, useOpportunities } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityTimeline } from '@/components/activity-timeline'
import { TaskList } from '@/components/task-list'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { CompanyFormDialog } from './company-form-dialog'
import { formatCurrency, extractErrorMessage } from '@/lib/utils'
import { companyStatusLabel, opportunityStatusLabel } from '@/lib/labels'

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: company, isLoading } = useCompany(id)
  const { data: contacts } = useContacts(id)
  const { data: allOpportunities } = useOpportunities()
  const deleteCompany = useDeleteCompany()
  const [editOpen, setEditOpen] = useState(false)

  const opportunities = useMemo(
    () => (allOpportunities ?? []).filter((o) => o.companyId === id),
    [allOpportunities, id],
  )

  if (isLoading) return <Skeleton className="m-6 h-96" />
  if (!company || !id) return <EmptyState title="Empresa não encontrada" />

  function handleDelete() {
    if (!confirm(`Excluir "${company!.name}"? Essa ação não pode ser desfeita.`)) return
    deleteCompany.mutate(company!.id, {
      onSuccess: () => {
        toast.success('Empresa excluída.')
        navigate('/companies')
      },
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border">
        <div>
          <Link to="/companies" className="inline-flex items-center gap-1 text-xs text-text-faint hover:text-text mb-2">
            <ArrowLeft className="h-3 w-3" /> Empresas
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Building2 className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold text-text">{company.name}</h1>
            <Badge variant={company.status === 'customer' ? 'accent' : company.status === 'churned' ? 'danger' : 'outline'}>
              {companyStatusLabel[company.status] ?? company.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="companies:write">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
            </Button>
          </PermissionGate>
          <PermissionGate permission="companies:delete">
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteCompany.isPending}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="opportunities">
            <TabsList>
              <TabsTrigger value="opportunities">Oportunidades ({opportunities.length})</TabsTrigger>
              <TabsTrigger value="contacts">Contatos ({contacts?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="activities">Atividades</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities">
              {opportunities.length === 0 && <EmptyState title="Nenhuma oportunidade para esta empresa" />}
              <div className="space-y-2">
                {opportunities.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-text">{o.name}</p>
                      <p className="text-xs text-text-faint">{formatCurrency(o.amount, o.currency)}</p>
                    </div>
                    <Badge variant={o.status === 'won' ? 'accent' : o.status === 'lost' ? 'danger' : 'outline'}>
                      {opportunityStatusLabel[o.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="contacts">
              {(contacts?.length ?? 0) === 0 && <EmptyState title="Nenhum contato para esta empresa" />}
              <div className="space-y-2">
                {(contacts ?? []).map((c) => (
                  <Link
                    key={c.id}
                    to={`/contacts/${c.id}`}
                    className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 hover:border-border-strong"
                  >
                    <div>
                      <p className="text-sm font-medium text-text">
                        {c.firstName} {c.lastName ?? ''}
                      </p>
                      <p className="text-xs text-text-faint">{c.email ?? c.title ?? '—'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activities">
              <ActivityTimeline relatedToType="company" relatedToId={id} />
            </TabsContent>

            <TabsContent value="tasks">
              <TaskList relatedToType="company" relatedToId={id} />
            </TabsContent>
          </Tabs>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Dados da empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-text-faint">Domínio</p>
              <p className="text-text">{company.domain ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Setor</p>
              <p className="text-text">{company.industry ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Funcionários</p>
              <p className="text-text">{company.employeeCount ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Receita anual</p>
              <p className="text-text">{company.annualRevenue ? formatCurrency(company.annualRevenue) : '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CompanyFormDialog open={editOpen} onOpenChange={setEditOpen} company={company} />
    </div>
  )
}
