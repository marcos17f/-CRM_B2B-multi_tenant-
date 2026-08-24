import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Megaphone } from 'lucide-react'
import { useCampaigns } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { PermissionGate } from '@/components/permission-gate'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { campaignStatusLabel, campaignTypeLabel } from '@/lib/labels'
import { formatDate, formatCurrency } from '@/lib/utils'
import { CampaignFormDialog } from './campaign-form-dialog'

const STATUS_VARIANT: Record<string, 'default' | 'accent' | 'warning' | 'outline'> = {
  draft: 'default',
  active: 'accent',
  paused: 'warning',
  ended: 'outline',
}

export function CampaignsPage() {
  const { data: campaigns, isLoading } = useCampaigns()
  const [formOpen, setFormOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Campanhas"
        description="Origem de contatos e oportunidades"
        actions={
          <PermissionGate permission="campaigns:write">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Nova campanha
            </Button>
          </PermissionGate>
        }
      />

      <div className="p-6">
        {isLoading && <Skeleton className="h-64 w-full" />}

        {!isLoading && (campaigns?.length ?? 0) === 0 && (
          <EmptyState icon={Megaphone} title="Nenhuma campanha ainda" description="Crie campanhas para rastrear a origem de contatos e oportunidades." />
        )}

        {!isLoading && campaigns && campaigns.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Orçamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-text-muted">{campaignTypeLabel[c.type] ?? c.type}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[c.status] ?? 'default'}>{campaignStatusLabel[c.status] ?? c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-text-muted text-xs">
                    {c.startsAt ? formatDate(c.startsAt) : '—'} → {c.endsAt ? formatDate(c.endsAt) : '—'}
                  </TableCell>
                  <TableCell className="text-text-muted">{c.budget ? formatCurrency(c.budget) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CampaignFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
