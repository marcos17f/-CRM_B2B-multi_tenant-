import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle2, PlayCircle, Plus, Trash2, XCircle } from 'lucide-react'
import type { ServiceOrder } from '@/api/types'
import {
  useCompany,
  useServiceOrderParts,
  useAddServiceOrderPart,
  useRemoveServiceOrderPart,
  useStartServiceOrder,
  useCompleteServiceOrder,
  useCancelServiceOrder,
  useProducts,
} from '@/hooks/queries'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityTimeline } from '@/components/activity-timeline'
import { EmptyState } from '@/components/empty-state'
import { PermissionGate } from '@/components/permission-gate'
import { formatCurrency, formatDate, extractErrorMessage } from '@/lib/utils'
import { serviceOrderStatusLabel, serviceOrderTypeLabel } from '@/lib/labels'

const STATUS_VARIANT: Record<string, 'accent' | 'blue' | 'danger' | 'outline'> = {
  open: 'outline',
  in_progress: 'blue',
  completed: 'accent',
  cancelled: 'danger',
}

export function ServiceOrderDetailSheet({ serviceOrder, onOpenChange }: { serviceOrder: ServiceOrder | null; onOpenChange: (open: boolean) => void }) {
  const { data: company } = useCompany(serviceOrder?.companyId)
  const { data: parts } = useServiceOrderParts(serviceOrder?.id)
  const { data: products } = useProducts()
  const addPart = useAddServiceOrderPart()
  const removePart = useRemoveServiceOrderPart()
  const start = useStartServiceOrder()
  const complete = useCompleteServiceOrder()
  const cancel = useCancelServiceOrder()

  const [productId, setProductId] = useState<string | undefined>(undefined)
  const [quantity, setQuantity] = useState('1')

  if (!serviceOrder) return null

  const isClosed = serviceOrder.status === 'completed' || serviceOrder.status === 'cancelled'

  function handleAddPart() {
    if (!productId || !quantity) {
      toast.error('Selecione a peça e a quantidade.')
      return
    }
    addPart.mutate(
      { id: serviceOrder!.id, payload: { productId, quantity: Number(quantity) } },
      {
        onSuccess: () => {
          toast.success('Peça adicionada.')
          setProductId(undefined)
          setQuantity('1')
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  function handleRemovePart(partId: string) {
    removePart.mutate(
      { id: serviceOrder!.id, partId },
      { onSuccess: () => toast.success('Peça removida.'), onError: (err) => toast.error(extractErrorMessage(err)) },
    )
  }

  function handleStart() {
    start.mutate(serviceOrder!.id, { onSuccess: () => toast.success('Ordem iniciada.'), onError: (err) => toast.error(extractErrorMessage(err)) })
  }
  function handleComplete() {
    complete.mutate(serviceOrder!.id, {
      onSuccess: () => toast.success('Ordem concluída — estoque das peças baixado.'),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }
  function handleCancel() {
    if (!confirm('Cancelar esta ordem de serviço?')) return
    cancel.mutate(serviceOrder!.id, { onSuccess: () => toast.success('Ordem cancelada.'), onError: (err) => toast.error(extractErrorMessage(err)) })
  }

  return (
    <Sheet open={!!serviceOrder} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{serviceOrderTypeLabel[serviceOrder.type] ?? serviceOrder.type}</SheetTitle>
            <Badge variant={STATUS_VARIANT[serviceOrder.status] ?? 'outline'}>{serviceOrderStatusLabel[serviceOrder.status]}</Badge>
          </div>
          {company && (
            <Link to={`/companies/${company.id}`} className="mt-1 inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent">
              <Building2 className="h-3.5 w-3.5" /> {company.name}
            </Link>
          )}
        </SheetHeader>

        {!isClosed && (
          <PermissionGate permission="service_orders:write">
            <div className="mb-4 flex items-center justify-end gap-2">
              {serviceOrder.status === 'open' && (
                <Button size="sm" variant="secondary" onClick={handleStart} disabled={start.isPending}>
                  <PlayCircle className="h-3.5 w-3.5 mr-1.5" /> Iniciar
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={handleCancel} disabled={cancel.isPending}>
                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleComplete} disabled={complete.isPending}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Concluir
              </Button>
            </div>
          </PermissionGate>
        )}

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="parts">Peças</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-text-faint">Descrição</p>
              <p className="text-text">{serviceOrder.description ?? '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-faint">Agendada para</p>
                <p className="text-text">{formatDate(serviceOrder.scheduledDate)}</p>
              </div>
              <div>
                <p className="text-xs text-text-faint">Concluída em</p>
                <p className="text-text">{formatDate(serviceOrder.completedAt)}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parts" className="space-y-3">
            {(parts?.length ?? 0) === 0 ? (
              <EmptyState title="Nenhuma peça adicionada" />
            ) : (
              <div className="space-y-2">
                {parts!.map((part) => (
                  <div key={part.id} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
                    <div>
                      <p className="text-sm text-text">{part.description}</p>
                      <p className="text-xs text-text-faint">
                        {part.quantity} × {formatCurrency(part.unitPrice)} = {formatCurrency(part.subtotal)}
                      </p>
                    </div>
                    {!isClosed && (
                      <PermissionGate permission="service_orders:write">
                        <Button size="icon" variant="ghost" onClick={() => handleRemovePart(part.id)} disabled={removePart.isPending}>
                          <Trash2 className="h-3.5 w-3.5 text-danger" />
                        </Button>
                      </PermissionGate>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isClosed && (
              <PermissionGate permission="service_orders:write">
                <div className="rounded-md border border-border bg-bg-subtle p-3 space-y-2">
                  <Label>Peça</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a peça" />
                    </SelectTrigger>
                    <SelectContent>
                      {(products ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({Number(p.stockQuantity)} em estoque)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="part-qty">Quantidade</Label>
                  <div className="flex items-center gap-2">
                    <Input id="part-qty" type="number" min={0} step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    <Button size="sm" onClick={handleAddPart} disabled={addPart.isPending}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar
                    </Button>
                  </div>
                </div>
              </PermissionGate>
            )}
          </TabsContent>

          <TabsContent value="activities">
            <ActivityTimeline relatedToType="service_order" relatedToId={serviceOrder.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
