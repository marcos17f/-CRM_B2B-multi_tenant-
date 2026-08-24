import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Megaphone, Pencil } from 'lucide-react'
import { useCampaign, useContacts, useOpportunities } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { CampaignFormDialog } from './campaign-form-dialog'
import { campaignStatusLabel, campaignTypeLabel, opportunityStatusLabel } from '@/lib/labels'
import { formatCurrency, formatDate } from '@/lib/utils'

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: campaign, isLoading } = useCampaign(id)
  const { data: allContacts } = useContacts()
  const { data: allOpportunities } = useOpportunities()
  const [editOpen, setEditOpen] = useState(false)

  const contacts = useMemo(() => (allContacts ?? []).filter((c) => c.sourceCampaignId === id), [allContacts, id])
  const opportunities = useMemo(
    () => (allOpportunities ?? []).filter((o) => o.sourceCampaignId === id),
    [allOpportunities, id],
  )

  if (isLoading) return <Skeleton className="m-6 h-96" />
  if (!campaign || !id) return <EmptyState title="Campanha não encontrada" />

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border">
        <div>
          <Link to="/campaigns" className="inline-flex items-center gap-1 text-xs text-text-faint hover:text-text mb-2">
            <ArrowLeft className="h-3 w-3" /> Campanhas
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Megaphone className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold text-text">{campaign.name}</h1>
            <Badge variant="outline">{campaignStatusLabel[campaign.status]}</Badge>
          </div>
        </div>
        <PermissionGate permission="campaigns:write">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
          </Button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-text mb-2">Contatos originados ({contacts.length})</h2>
            {contacts.length === 0 ? (
              <EmptyState title="Nenhum contato originado por esta campanha" />
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <Link
                    key={c.id}
                    to={`/contacts/${c.id}`}
                    className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 hover:border-border-strong"
                  >
                    <span className="text-sm text-text">
                      {c.firstName} {c.lastName ?? ''}
                    </span>
                    <span className="text-xs text-text-faint">{c.email ?? '—'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-text mb-2">Oportunidades originadas ({opportunities.length})</h2>
            {opportunities.length === 0 ? (
              <EmptyState title="Nenhuma oportunidade originada por esta campanha" />
            ) : (
              <div className="space-y-2">
                {opportunities.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5">
                    <span className="text-sm text-text">{o.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-faint">{formatCurrency(o.amount, o.currency)}</span>
                      <Badge variant={o.status === 'won' ? 'accent' : o.status === 'lost' ? 'danger' : 'outline'}>
                        {opportunityStatusLabel[o.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Dados da campanha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-text-faint">Tipo</p>
              <p className="text-text">{campaignTypeLabel[campaign.type] ?? campaign.type}</p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Período</p>
              <p className="text-text">
                {campaign.startsAt ? formatDate(campaign.startsAt) : '—'} → {campaign.endsAt ? formatDate(campaign.endsAt) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Orçamento</p>
              <p className="text-text">{campaign.budget ? formatCurrency(campaign.budget) : '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CampaignFormDialog open={editOpen} onOpenChange={setEditOpen} campaign={campaign} />
    </div>
  )
}
