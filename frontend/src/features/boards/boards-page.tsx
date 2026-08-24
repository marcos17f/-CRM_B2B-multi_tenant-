import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCompanies, useMoveOpportunityStage, useOpportunities, usePipelines } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { PermissionGate } from '@/components/permission-gate'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { BoardColumn } from './board-column'
import { OpportunityFormDialog } from './opportunity-form-dialog'
import { OpportunityDetailSheet } from './opportunity-detail-sheet'
import { LostReasonDialog } from './lost-reason-dialog'
import { extractErrorMessage } from '@/lib/utils'
import { KanbanSquare } from 'lucide-react'

export function BoardsPage() {
  const { data: pipelines, isLoading: loadingPipelines } = usePipelines()
  const [pipelineId, setPipelineId] = useState<string | undefined>(undefined)

  const activePipeline = useMemo(() => {
    if (!pipelines?.length) return undefined
    return pipelines.find((p) => p.id === pipelineId) ?? pipelines.find((p) => p.isDefault) ?? pipelines[0]
  }, [pipelines, pipelineId])

  const { data: opportunities, isLoading: loadingOpportunities } = useOpportunities(
    activePipeline ? { pipelineId: activePipeline.id } : {},
  )
  const { data: companies } = useCompanies()
  const companyById = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c])), [companies])

  const moveStage = useMoveOpportunityStage()

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null)
  const selectedOpportunity = useMemo(
    () => (opportunities ?? []).find((o) => o.id === selectedOpportunityId) ?? null,
    [opportunities, selectedOpportunityId],
  )
  const [pendingLostDrop, setPendingLostDrop] = useState<{ opportunityId: string; stageId: string } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || !activePipeline) return
    const opportunityId = String(active.id)
    const targetStageId = String(over.id)

    const opportunity = (opportunities ?? []).find((o) => o.id === opportunityId)
    if (!opportunity || opportunity.stageId === targetStageId) return

    const targetStage = activePipeline.stages.find((s) => s.id === targetStageId)
    if (!targetStage) return

    if (targetStage.stageType === 'lost') {
      setPendingLostDrop({ opportunityId, stageId: targetStageId })
      return
    }

    moveStage.mutate(
      { id: opportunityId, stageId: targetStageId },
      { onError: (err) => toast.error(extractErrorMessage(err)) },
    )
  }

  function confirmLostDrop(reason: string) {
    if (!pendingLostDrop) return
    moveStage.mutate(
      { id: pendingLostDrop.opportunityId, stageId: pendingLostDrop.stageId, lostReason: reason },
      {
        onSuccess: () => setPendingLostDrop(null),
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  const isLoading = loadingPipelines || loadingOpportunities

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Boards"
        description={activePipeline ? `Pipeline ${activePipeline.name}` : undefined}
        actions={
          <>
            {pipelines && pipelines.length > 1 && (
              <Select value={activePipeline?.id} onValueChange={setPipelineId}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <PermissionGate permission="opportunities:write">
              <Button onClick={() => setCreateOpen(true)} disabled={!activePipeline}>
                <Plus className="h-4 w-4 mr-1.5" /> Nova oportunidade
              </Button>
            </PermissionGate>
          </>
        }
      />

      <div className="flex-1 overflow-x-auto p-4">
        {isLoading && (
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96 w-72 shrink-0" />
            ))}
          </div>
        )}

        {!isLoading && !activePipeline && (
          <EmptyState icon={KanbanSquare} title="Nenhum pipeline encontrado" description="Crie um pipeline para começar a organizar oportunidades." />
        )}

        {!isLoading && activePipeline && (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 h-full">
              {[...activePipeline.stages]
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((stage) => (
                  <BoardColumn
                    key={stage.id}
                    stage={stage}
                    opportunities={(opportunities ?? []).filter((o) => o.stageId === stage.id)}
                    companyById={companyById}
                    onCardClick={(o) => setSelectedOpportunityId(o.id)}
                  />
                ))}
            </div>
          </DndContext>
        )}
      </div>

      {activePipeline && (
        <OpportunityFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          pipeline={activePipeline}
          defaultStageId={activePipeline.stages.find((s) => s.stageType === 'open')?.id ?? ''}
        />
      )}

      <OpportunityDetailSheet
        opportunity={selectedOpportunity}
        pipeline={activePipeline}
        onOpenChange={(open) => !open && setSelectedOpportunityId(null)}
      />

      <LostReasonDialog
        open={!!pendingLostDrop}
        onOpenChange={(open) => !open && setPendingLostDrop(null)}
        onConfirm={confirmLostDrop}
        isPending={moveStage.isPending}
      />
    </div>
  )
}
