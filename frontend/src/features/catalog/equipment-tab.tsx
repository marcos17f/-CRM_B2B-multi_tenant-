import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Wrench } from 'lucide-react'
import { useEquipmentList, useCompanies } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { equipmentStatusLabel } from '@/lib/labels'
import { EquipmentFormDialog } from './equipment-form-dialog'

export function EquipmentTab() {
  const { data: equipment, isLoading } = useEquipmentList()
  const { data: companies } = useCompanies()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const companyNameById = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c.name])), [companies])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return equipment ?? []
    return (equipment ?? []).filter(
      (e) => e.name.toLowerCase().includes(q) || e.serialNumber?.toLowerCase().includes(q) || companyNameById.get(e.companyId)?.toLowerCase().includes(q),
    )
  }, [equipment, search, companyNameById])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar equipamento..." className="pl-8" />
        </div>
        <PermissionGate permission="equipment:write">
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo equipamento
          </Button>
        </PermissionGate>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState icon={Wrench} title="Nenhum equipamento cadastrado" description="Cadastre as máquinas que seus clientes possuem." />
      )}

      {!isLoading && filtered.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Fabricante/Modelo</TableHead>
              <TableHead>Nº de série</TableHead>
              <TableHead>Compra</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>
                  <Link to={`/companies/${e.companyId}`} className="text-text-muted hover:text-accent">
                    {companyNameById.get(e.companyId) ?? '—'}
                  </Link>
                </TableCell>
                <TableCell className="text-text-muted">
                  {[e.manufacturer, e.model].filter(Boolean).join(' / ') || '—'}
                </TableCell>
                <TableCell className="text-text-faint">{e.serialNumber ?? '—'}</TableCell>
                <TableCell className="text-text-muted">{formatDate(e.purchaseDate)}</TableCell>
                <TableCell>
                  <Badge variant={e.status === 'active' ? 'accent' : 'outline'}>{equipmentStatusLabel[e.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <EquipmentFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
