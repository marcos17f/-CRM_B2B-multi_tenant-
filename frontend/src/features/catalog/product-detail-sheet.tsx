import { useState } from 'react'
import { toast } from 'sonner'
import { PackagePlus, PackageMinus } from 'lucide-react'
import type { Product } from '@/api/types'
import { useProductMovements, useAdjustStock, useUpdateProduct } from '@/hooks/queries'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/empty-state'
import { PermissionGate } from '@/components/permission-gate'
import { formatCurrency, formatDateTime, extractErrorMessage } from '@/lib/utils'
import { productCategoryLabel, productStatusLabel } from '@/lib/labels'

const MOVEMENT_LABEL: Record<string, string> = {
  sale: 'Venda',
  service_use: 'Uso em OS',
  adjustment: 'Ajuste',
  restock: 'Reposição',
}

export function ProductDetailSheet({ product, onOpenChange }: { product: Product | null; onOpenChange: (open: boolean) => void }) {
  const { data: movements } = useProductMovements(product?.id)
  const adjustStock = useAdjustStock()
  const updateProduct = useUpdateProduct()
  const [adjustQty, setAdjustQty] = useState('')

  if (!product) return null

  function handleAdjust(sign: 1 | -1) {
    const qty = Number(adjustQty)
    if (!qty || qty <= 0) {
      toast.error('Informe uma quantidade válida.')
      return
    }
    adjustStock.mutate(
      { id: product!.id, quantityDelta: sign * qty, type: sign === 1 ? 'restock' : 'adjustment' },
      {
        onSuccess: () => {
          toast.success('Estoque atualizado.')
          setAdjustQty('')
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  function toggleDiscontinued() {
    updateProduct.mutate(
      { id: product!.id, payload: { status: product!.status === 'active' ? 'discontinued' : 'active' } },
      { onError: (err) => toast.error(extractErrorMessage(err)) },
    )
  }

  return (
    <Sheet open={!!product} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{product.name}</SheetTitle>
            <Badge variant={product.status === 'active' ? 'accent' : 'outline'}>{productStatusLabel[product.status]}</Badge>
          </div>
          <p className="text-xs text-text-faint mt-1">
            {product.sku} · {productCategoryLabel[product.category] ?? product.category}
          </p>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div>
            <p className="text-xs text-text-faint">Preço</p>
            <p className="text-text">{formatCurrency(product.price)}</p>
          </div>
          <div>
            <p className="text-xs text-text-faint">Estoque atual</p>
            <p className="text-text">
              {product.trackStock ? `${Number(product.stockQuantity)} ${product.unit}` : 'Não controlado'}
            </p>
          </div>
        </div>

        <PermissionGate permission="products:write">
          <div className="flex justify-end mb-4">
            <Button size="sm" variant="secondary" onClick={toggleDiscontinued} disabled={updateProduct.isPending}>
              {product.status === 'active' ? 'Descontinuar' : 'Reativar'}
            </Button>
          </div>

          {product.trackStock && (
            <div className="mb-4 rounded-md border border-border bg-bg-subtle p-3 space-y-2">
              <Label htmlFor="adjust-qty">Ajustar estoque</Label>
              <div className="flex items-center gap-2">
                <Input id="adjust-qty" type="number" min={0} step="0.001" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="flex-1" />
                <Button size="icon" variant="secondary" onClick={() => handleAdjust(1)} disabled={adjustStock.isPending} title="Repor estoque">
                  <PackagePlus className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" onClick={() => handleAdjust(-1)} disabled={adjustStock.isPending} title="Baixar estoque">
                  <PackageMinus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </PermissionGate>

        <p className="text-xs font-medium text-text-faint mb-2">Movimentações de estoque</p>
        {(movements?.length ?? 0) === 0 ? (
          <EmptyState title="Sem movimentações ainda" />
        ) : (
          <ul className="divide-y divide-border">
            {movements!.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-text">{MOVEMENT_LABEL[m.type] ?? m.type}</p>
                  <p className="text-xs text-text-faint">{formatDateTime(m.createdAt)}</p>
                </div>
                <span className={Number(m.quantityDelta) < 0 ? 'text-danger' : 'text-accent'}>
                  {Number(m.quantityDelta) > 0 ? '+' : ''}
                  {m.quantityDelta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
