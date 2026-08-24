import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ActivityDescription, ACTIVITY_ICONS } from '@/components/activity-timeline'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useRecentActivities,
  useCompanies,
  useContacts,
  useOpportunities,
  useEquipmentList,
  useServiceOrders,
  useMembers,
  usePipelines,
} from '@/hooks/queries'
import { activityTypeLabel, relatedToTypeLabel } from '@/lib/labels'
import { formatDateTime } from '@/lib/utils'
import { Settings2 } from 'lucide-react'

export function RecentActivityFeed({ limit = 15 }: { limit?: number }) {
  const { data: activities, isLoading } = useRecentActivities(limit)
  const { data: companies } = useCompanies()
  const { data: contacts } = useContacts()
  const { data: opportunities } = useOpportunities()
  const { data: equipment } = useEquipmentList()
  const { data: serviceOrders } = useServiceOrders()
  const { data: members } = useMembers()
  const { data: pipelines } = usePipelines()

  const stageNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const pipeline of pipelines ?? []) for (const stage of pipeline.stages) map.set(stage.id, stage.name)
    return map
  }, [pipelines])

  const memberNameById = useMemo(() => new Map((members ?? []).map((m) => [m.id, m.name])), [members])

  const entityLabel = useMemo(() => {
    const companyById = new Map((companies ?? []).map((c) => [c.id, c.name]))
    const contactById = new Map((contacts ?? []).map((c) => [c.id, `${c.firstName} ${c.lastName ?? ''}`.trim()]))
    const opportunityById = new Map((opportunities ?? []).map((o) => [o.id, o.name]))
    const equipmentById = new Map((equipment ?? []).map((e) => [e.id, e.name]))
    const serviceOrderById = new Map((serviceOrders ?? []).map((so) => [so.id, so.description ?? `OS ${so.id.slice(0, 8)}`]))

    return (relatedToType: string, relatedToId: string) => {
      switch (relatedToType) {
        case 'company':
          return companyById.get(relatedToId) ?? 'Empresa';
        case 'contact':
          return contactById.get(relatedToId) ?? 'Contato';
        case 'opportunity':
          return opportunityById.get(relatedToId) ?? 'Oportunidade';
        case 'equipment':
          return equipmentById.get(relatedToId) ?? 'Equipamento';
        case 'service_order':
          return serviceOrderById.get(relatedToId) ?? 'Ordem de serviço';
        default:
          return relatedToType
      }
    }
  }, [companies, contacts, opportunities, equipment, serviceOrders])

  function linkFor(relatedToType: string, relatedToId: string): string | null {
    if (relatedToType === 'company') return `/companies/${relatedToId}`
    if (relatedToType === 'contact') return `/contacts/${relatedToId}`
    return null
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if ((activities?.length ?? 0) === 0) return <EmptyState title="Nenhuma atividade ainda" />

  return (
    <ul className="divide-y divide-border">
      {activities!.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type] ?? Settings2
        const actor = activity.actorId ? (memberNameById.get(activity.actorId) ?? 'Alguém') : 'Sistema/IA'
        const label = entityLabel(activity.relatedToType, activity.relatedToId)
        const href = linkFor(activity.relatedToType, activity.relatedToId)

        return (
          <li key={activity.id} className="flex items-start gap-3 py-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
              <Icon className="h-3.5 w-3.5 text-text-muted" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text">
                <span className="font-medium">{activityTypeLabel[activity.type] ?? activity.type}</span>
                <span className="text-text-faint">
                  {' '}
                  · {relatedToTypeLabel[activity.relatedToType] ?? activity.relatedToType}:{' '}
                </span>
                {href ? (
                  <Link to={href} className="text-accent hover:underline">
                    {label}
                  </Link>
                ) : (
                  <span className="text-text-muted">{label}</span>
                )}
                <span className="text-text-faint"> · {actor}</span>
              </p>
              <div className="text-xs text-text-faint mt-0.5">
                <ActivityDescription activity={activity} stageNameById={stageNameById} />
              </div>
            </div>
            <span className="shrink-0 text-xs text-text-faint whitespace-nowrap">{formatDateTime(activity.occurredAt)}</span>
          </li>
        )
      })}
    </ul>
  )
}
