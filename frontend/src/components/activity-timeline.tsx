import { useMemo, useState } from 'react'
import { Phone, Mail, Users, StickyNote, ArrowRightLeft, CheckCircle2, ListPlus, Bot, Settings2 } from 'lucide-react'
import { useActivities, useCreateActivity, useMembers, usePipelines } from '@/hooks/queries'
import { activityTypeLabel } from '@/lib/labels'
import { formatDateTime, extractErrorMessage } from '@/lib/utils'
import type { Activity, ManualActivityType, RelatedToType } from '@/api/types'
import { MANUAL_ACTIVITY_TYPES } from '@/api/types'
import { PermissionGate } from '@/components/permission-gate'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: StickyNote,
  stage_change: ArrowRightLeft,
  task_created: ListPlus,
  task_completed: CheckCircle2,
  system: Settings2,
  ai_suggestion: Bot,
}

function ActivityDescription({ activity, stageNameById }: { activity: Activity; stageNameById: Map<string, string> }) {
  const p = activity.payload as Record<string, unknown>

  if (activity.type === 'stage_change') {
    const from = stageNameById.get(p.fromStageId as string) ?? 'estágio anterior'
    const to = stageNameById.get(p.toStageId as string) ?? 'novo estágio'
    if (p.reopened) return <>Oportunidade reaberta e movida para <strong>{to}</strong>.</>
    return (
      <>
        Movida de <strong>{from}</strong> para <strong>{to}</strong>.
      </>
    )
  }
  if (activity.type === 'system' && p.event === 'created') {
    return <>Registro criado.</>
  }
  if (activity.type === 'task_created' || activity.type === 'task_completed') {
    return <>Tarefa: {String(p.subject ?? '')}</>
  }
  if (typeof p.notes === 'string' && p.notes) {
    return <>{p.notes}</>
  }
  return null
}

function ManualActivityForm({ relatedToType, relatedToId }: { relatedToType: RelatedToType; relatedToId: string }) {
  const [type, setType] = useState<ManualActivityType>('note')
  const [notes, setNotes] = useState('')
  const createActivity = useCreateActivity()

  function submit() {
    if (!notes.trim()) {
      toast.error('Escreva algo antes de registrar.')
      return
    }
    createActivity.mutate(
      { type, relatedToType, relatedToId, payload: { notes } },
      {
        onSuccess: () => {
          setNotes('')
          toast.success('Atividade registrada.')
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  return (
    <div className="rounded-md border border-border bg-bg-subtle p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Select value={type} onValueChange={(v) => setType(v as ManualActivityType)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MANUAL_ACTIVITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {activityTypeLabel[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-text-faint">Registrar atividade manual</span>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="O que aconteceu?"
        className="min-h-[64px]"
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={createActivity.isPending}>
          {createActivity.isPending ? 'Salvando...' : 'Registrar'}
        </Button>
      </div>
    </div>
  )
}

export function ActivityTimeline({ relatedToType, relatedToId }: { relatedToType: RelatedToType; relatedToId: string }) {
  const { data: activities, isLoading } = useActivities(relatedToType, relatedToId)
  const { data: pipelines } = usePipelines()
  const { data: members } = useMembers()

  const stageNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const pipeline of pipelines ?? []) {
      for (const stage of pipeline.stages) map.set(stage.id, stage.name)
    }
    return map
  }, [pipelines])

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of members ?? []) map.set(m.id, m.name)
    return map
  }, [members])

  return (
    <div className="space-y-4">
      <PermissionGate permission="activities:write">
        <ManualActivityForm relatedToType={relatedToType} relatedToId={relatedToId} />
      </PermissionGate>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!isLoading && (activities?.length ?? 0) === 0 && (
        <EmptyState title="Sem atividades ainda" description="Ligações, e-mails, reuniões e mudanças de estágio aparecem aqui." />
      )}

      {!isLoading && activities && activities.length > 0 && (
        <ol className="relative space-y-4 border-l border-border pl-4">
          {activities.map((activity) => {
            const Icon = ICONS[activity.type] ?? Settings2
            const actor = activity.actorId ? memberNameById.get(activity.actorId) ?? 'Alguém' : 'Sistema'
            return (
              <li key={activity.id} className="relative">
                <span className="absolute -left-[21px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface">
                  <Icon className="h-3.5 w-3.5 text-text-muted" />
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm text-text">
                    <span className="font-medium">{activityTypeLabel[activity.type] ?? activity.type}</span>
                    <span className="text-text-faint"> · {actor}</span>
                  </p>
                  <span className="text-xs text-text-faint whitespace-nowrap">{formatDateTime(activity.occurredAt)}</span>
                </div>
                <div className="text-sm text-text-muted mt-0.5">
                  <ActivityDescription activity={activity} stageNameById={stageNameById} />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
