import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ClipboardList } from 'lucide-react'
import type { ServiceOrder } from '@/api/types'
import { useServiceOrders, useCompanies } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { serviceOrderStatusLabel, serviceOrderTypeLabel } from '@/lib/labels'
import { ServiceOrderFormDialog } from './service-order-form-dialog'
import { ServiceOrderDetailSheet } from './service-order-detail-sheet'

const STATUS_VARIANT: Record<string, 'accent' | 'blue' | 'danger' | 'outline'> = {
  open: 'outline',
  in_progress: 'blue',
  completed: 'accent',
  cancelled: 'danger',
}

export function ServiceOrdersTab() {
  const [status, setStatus] = useState('all')
  const { data: serviceOrders, isLoading } = useServiceOrders(status === 'all' ? {} : { status })
  const { data: companies } = useCompanies()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<ServiceOrder | null>(null)

  const companyNameById = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c.name])), [companies])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return serviceOrders ?? []
    return (serviceOrders ?? []).filter(
      (so) => so.description?.toLowerCase().includes(q) || companyNameById.get(so.companyId)?.toLowerCase().includes(q),
    )
  }, [serviceOrders, search, companyNameById])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ordem de serviço..." className="pl-8" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {Object.entries(serviceOrderStatusLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PermissionGate permission="service_orders:write">
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova ordem de serviço
          </Button>
        </PermissionGate>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState icon={ClipboardList} title="Nenhuma ordem de serviço" description="Assistência técnica e manutenção de equipamentos aparecem aqui." />
      )}

      {!isLoading && filtered.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Agendada</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((so) => (
              <TableRow key={so.id} className="cursor-pointer" onClick={() => setSelected(so)}>
                <TableCell className="font-medium">
                  <Link to={`/companies/${so.companyId}`} onClick={(e) => e.stopPropagation()} className="hover:text-accent">
                    {companyNameById.get(so.companyId) ?? '—'}
                  </Link>
                </TableCell>
                <TableCell className="text-text-muted">{serviceOrderTypeLabel[so.type] ?? so.type}</TableCell>
                <TableCell className="text-text-muted">{so.description ?? '—'}</TableCell>
                <TableCell className="text-text-muted">{formatDate(so.scheduledDate)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[so.status] ?? 'outline'}>{serviceOrderStatusLabel[so.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ServiceOrderFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ServiceOrderDetailSheet serviceOrder={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}
