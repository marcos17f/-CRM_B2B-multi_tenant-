import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Building2 } from 'lucide-react'
import { useCompanies, useContacts } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { PermissionGate } from '@/components/permission-gate'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ContactFormDialog } from './contact-form-dialog'

export function ContactsPage() {
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const { data: contacts, isLoading } = useContacts(companyId)
  const { data: companies } = useCompanies()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const navigate = useNavigate()

  const companyById = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c])), [companies])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return contacts ?? []
    return (contacts ?? []).filter(
      (c) =>
        `${c.firstName} ${c.lastName ?? ''}`.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q),
    )
  }, [contacts, search])

  return (
    <div>
      <PageHeader
        title="Contatos"
        description="Pessoas dentro das empresas com quem você se relaciona"
        actions={
          <>
            <Link to="/companies">
              <Button variant="outline" size="sm">
                <Building2 className="h-3.5 w-3.5 mr-1.5" /> Ver empresas
              </Button>
            </Link>
            <PermissionGate permission="contacts:write">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Novo contato
              </Button>
            </PermissionGate>
          </>
        }
      />

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contato..." className="pl-8" />
          </div>
          <Select value={companyId} onValueChange={(v) => setCompanyId(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todas as empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {(companies ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && <Skeleton className="h-64 w-full" />}

        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={Users} title="Nenhum contato encontrado" description="Cadastre o primeiro contato do workspace." />
        )}

        {!isLoading && filtered.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cargo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/contacts/${c.id}`)}>
                  <TableCell className="font-medium">
                    {c.firstName} {c.lastName ?? ''}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {c.companyId ? companyById.get(c.companyId)?.name ?? '—' : '—'}
                  </TableCell>
                  <TableCell className="text-text-muted">{c.email ?? '—'}</TableCell>
                  <TableCell className="text-text-muted">{c.title ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ContactFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
