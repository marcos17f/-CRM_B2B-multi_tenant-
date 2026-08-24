import { useMemo, useState } from 'react'
import { Plus, Search, Package } from 'lucide-react'
import type { Product } from '@/api/types'
import { useProducts } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { productCategoryLabel, productStatusLabel } from '@/lib/labels'
import { ProductFormDialog } from './product-form-dialog'
import { ProductDetailSheet } from './product-detail-sheet'

export function ProductsTab() {
  const [category, setCategory] = useState('all')
  const { data: products, isLoading } = useProducts(category === 'all' ? undefined : category)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products ?? []
    return (products ?? []).filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, search])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto..." className="pl-8" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {Object.entries(productCategoryLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="products:write">
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo produto
          </Button>
        </PermissionGate>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState icon={Package} title="Nenhum produto encontrado" description="Cadastre máquinas, sementes, grãos, peças ou serviços." />
      )}

      {!isLoading && filtered.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                <TableCell className="text-text-faint">{p.sku}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-text-muted">{productCategoryLabel[p.category] ?? p.category}</TableCell>
                <TableCell className="text-text-muted">{formatCurrency(p.price)}</TableCell>
                <TableCell className="text-text-muted">{p.trackStock ? `${Number(p.stockQuantity)} ${p.unit}` : '—'}</TableCell>
                <TableCell>
                  <Badge variant={p.status === 'active' ? 'accent' : 'outline'}>{productStatusLabel[p.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ProductDetailSheet product={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}
