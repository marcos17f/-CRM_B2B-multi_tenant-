import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Building2 } from 'lucide-react'
import { useCompanies } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { PermissionGate } from '@/components/permission-gate'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { companyStatusLabel } from '@/lib/labels'
import { CompanyFormDialog } from './company-form-dialog'

export function CompaniesPage() {
  const { data: companies, isLoading } = useCompanies()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return companies ?? []
    return (companies ?? []).filter((c) => c.name.toLowerCase().includes(q) || c.domain?.toLowerCase().includes(q))
  }, [companies, search])

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Contas que seus contatos e oportunidades pertencem"
        actions={
          <PermissionGate permission="companies:write">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Nova empresa
            </Button>
          </PermissionGate>
        }
      />

      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa..." className="pl-8" />
        </div>

        {isLoading && <Skeleton className="h-64 w-full" />}

        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={Building2} title="Nenhuma empresa encontrada" description="Cadastre a primeira empresa do workspace." />
        )}

        {!isLoading && filtered.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/companies/${c.id}`)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-text-muted">{c.domain ?? '—'}</TableCell>
                  <TableCell className="text-text-muted">{c.industry ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'customer' ? 'accent' : c.status === 'churned' ? 'danger' : 'outline'}>
                      {companyStatusLabel[c.status] ?? c.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CompanyFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
