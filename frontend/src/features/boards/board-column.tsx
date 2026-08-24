import { useDroppable } from '@dnd-kit/core'
import type { Company, Opportunity, PipelineStage } from '@/api/types'
import { OpportunityCard } from './opportunity-card'
import { formatCurrency, cn } from '@/lib/utils'

export function BoardColumn({
  stage,
  opportunities,
  companyById,
  onCardClick,
}: {
  stage: PipelineStage
  opportunities: Opportunity[]
  companyById: Map<string, Company>
  onCardClick: (opportunity: Opportunity) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const total = opportunities.reduce((sum, o) => sum + Number(o.amount), 0)

  const dotClass =
    stage.stageType === 'won' ? 'bg-accent' : stage.stageType === 'lost' ? 'bg-danger' : 'bg-accent-2'

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-bg-subtle">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('h-2 w-2 rounded-full shrink-0', dotClass)} />
          <span className="truncate text-sm font-medium text-text">{stage.name}</span>
          <span className="text-xs text-text-faint shrink-0">{opportunities.length}</span>
        </div>
      </div>
      <div className="px-3 pt-2 pb-1 text-xs text-text-faint">{formatCurrency(total)}</div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 overflow-y-auto p-2 min-h-[120px] transition-colors',
          isOver && 'bg-accent/5 ring-1 ring-inset ring-accent/30 rounded-b-lg',
        )}
      >
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            company={companyById.get(opp.companyId)}
            onClick={() => onCardClick(opp)}
          />
        ))}
      </div>
    </div>
  )
}
