import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Building2, Lock, RotateCcw, Plus, Trash2 } from 'lucide-react'
import type { Opportunity, Pipeline } from '@/api/types'
import {
  useCompany,
  useReopenOpportunity,
  useUpdateOpportunity,
  useOpportunityLineItems,
  useAddLineItem,
  useRemoveLineItem,
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
import { TaskList } from '@/components/task-list'
import { EmptyState } from '@/components/empty-state'
import { PermissionGate } from '@/components/permission-gate'
import { formatCurrency, extractErrorMessage } from '@/lib/utils'
import { opportunityStatusLabel, opportunityTypeLabel, riskLevelLabel } from '@/lib/labels'

function LineItemsTab({ opportunity, isOpen }: { opportunity: Opportunity; isOpen: boolean }) {
  const { data: lineItems, isLoading } = useOpportunityLineItems(opportunity.id)
  const { data: products } = useProducts()
  const addLineItem = useAddLineItem()
  const removeLineItem = useRemoveLineItem()

  const [productId, setProductId] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')

  function handleProductChange(id: string) {
    setProductId(id)
    const product = (products ?? []).find((p) => p.id === id)
    if (product) {
      setDescription(product.name)
      setUnitPrice(product.price)
    }
  }

  function handleAdd() {
    if (!description.trim() || !quantity || !unitPrice) {
      toast.error('Preencha descrição, quantidade e valor unitário.')
      return
    }
    addLineItem.mutate(
      { opportunityId: opportunity.id, payload: { productId, description, quantity: Number(quantity), unitPrice: Number(unitPrice) } },
      {
        onSuccess: () => {
          toast.success('Item adicionado.')
          setProductId(undefined)
          setDescription('')
          setQuantity('1')
          setUnitPrice('')
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  function handleRemove(lineItemId: string) {
    removeLineItem.mutate(
      { opportunityId: opportunity.id, lineItemId },
      { onSuccess: () => toast.success('Item removido.'), onError: (err) => toast.error(extractErrorMessage(err)) },
    )
  }

  if (isLoading) return null

  return (
    <div className="space-y-3">
      {(lineItems?.length ?? 0) === 0 ? (
        <EmptyState title="Nenhum item de linha" description="Adicione máquinas, sementes, grãos ou peças — o valor da oportunidade passa a ser calculado automaticamente." />
      ) : (
        <div className="space-y-2">
          {lineItems!.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
              <div>
                <p className="text-sm text-text">{item.description}</p>
                <p className="text-xs text-text-faint">
                  {item.quantity} × {formatCurrency(item.unitPrice, opportunity.currency)} = {formatCurrency(item.subtotal, opportunity.currency)}
                </p>
              </div>
              {isOpen && (
                <PermissionGate permission="opportunities:write">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(item.id)}
                    disabled={removeLineItem.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </PermissionGate>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between px-1 pt-1 text-sm font-medium text-text">
            <span>Total</span>
            <span>{formatCurrency(opportunity.amount, opportunity.currency)}</span>
          </div>
        </div>
      )}

      {isOpen && (
        <PermissionGate permission="opportunities:write">
          <div className="rounded-md border border-border bg-bg-subtle p-3 space-y-2">
            <div>
              <Label>Produto do catálogo (opcional)</Label>
              <Select value={productId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Item avulso (sem catálogo)" />
                </SelectTrigger>
                <SelectContent>
                  {(products ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="li-description">Descrição</Label>
              <Input id="li-description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="li-quantity">Quantidade</Label>
                <Input id="li-quantity" type="number" min={0} step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="li-price">Valor unitário</Label>
                <Input id="li-price" type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAdd} disabled={addLineItem.isPending}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar item
              </Button>
            </div>
          </div>
        </PermissionGate>
      )}
    </div>
  )
}

export function OpportunityDetailSheet({
  opportunity,
  pipeline,
  onOpenChange,
}: {
  opportunity: Opportunity | null
  pipeline: Pipeline | undefined
  onOpenChange: (open: boolean) => void
}) {
  const { data: company } = useCompany(opportunity?.companyId)
  const updateOpportunity = useUpdateOpportunity()
  const reopenOpportunity = useReopenOpportunity()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [riskLevel, setRiskLevel] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (opportunity) {
      setName(opportunity.name)
      setAmount(opportunity.amount)
      setRiskLevel(opportunity.riskLevel ?? undefined)
    }
  }, [opportunity])

  if (!opportunity) return null

  const isOpen = opportunity.status === 'open'
  const firstOpenStage = pipeline?.stages.find((s) => s.stageType === 'open')

  function saveChanges() {
    if (!opportunity) return
    updateOpportunity.mutate(
      { id: opportunity.id, payload: { name, amount: Number(amount), riskLevel: riskLevel as never } },
      {
        onSuccess: () => toast.success('Oportunidade atualizada.'),
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  function reopen() {
    if (!opportunity || !firstOpenStage) return
    reopenOpportunity.mutate(
      { id: opportunity.id, stageId: firstOpenStage.id },
      {
        onSuccess: () => toast.success('Oportunidade reaberta.'),
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  return (
    <Sheet open={!!opportunity} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{opportunity.name}</SheetTitle>
            <Badge variant={opportunity.status === 'won' ? 'accent' : opportunity.status === 'lost' ? 'danger' : 'outline'}>
              {opportunityStatusLabel[opportunity.status]}
            </Badge>
          </div>
          {company && (
            <Link
              to={`/companies/${company.id}`}
              className="mt-1 inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent"
            >
              <Building2 className="h-3.5 w-3.5" /> {company.name}
            </Link>
          )}
        </SheetHeader>

        {!isOpen && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-border bg-bg-subtle p-3">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Lock className="h-4 w-4" />
              {opportunity.status === 'lost' && opportunity.lostReason
                ? `Perdida: ${opportunity.lostReason}`
                : 'Oportunidade fechada — edição bloqueada.'}
            </div>
            <PermissionGate permission="opportunities:write">
              <Button size="sm" variant="secondary" onClick={reopen} disabled={reopenOpportunity.isPending}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reabrir
              </Button>
            </PermissionGate>
          </div>
        )}

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="items">Itens</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3">
            <div>
              <Label htmlFor="opp-name">Nome</Label>
              <Input id="opp-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isOpen} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="opp-amount">Valor</Label>
                <Input
                  id="opp-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!isOpen}
                />
                {!isOpen && <p className="mt-1 text-xs text-text-faint">{formatCurrency(opportunity.amount, opportunity.currency)}</p>}
              </div>
              <div>
                <Label>Risco</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel} disabled={!isOpen}>
                  <SelectTrigger>
                    <SelectValue placeholder="Não definido" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(riskLevelLabel).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-text-faint">Tipo</p>
                <p className="text-text">{opportunityTypeLabel[opportunity.type] ?? opportunity.type}</p>
              </div>
              <div>
                <p className="text-xs text-text-faint">Estágio atual</p>
                <p className="text-text">{pipeline?.stages.find((s) => s.id === opportunity.stageId)?.name ?? '—'}</p>
              </div>
            </div>

            {isOpen && (
              <PermissionGate permission="opportunities:write">
                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={saveChanges} disabled={updateOpportunity.isPending}>
                    {updateOpportunity.isPending ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </div>
              </PermissionGate>
            )}
          </TabsContent>

          <TabsContent value="items">
            <LineItemsTab opportunity={opportunity} isOpen={isOpen} />
          </TabsContent>

          <TabsContent value="activities">
            <ActivityTimeline relatedToType="opportunity" relatedToId={opportunity.id} />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskList relatedToType="opportunity" relatedToId={opportunity.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
