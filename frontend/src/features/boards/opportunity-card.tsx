import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, Building2, Lock } from 'lucide-react'
import type { Company, Opportunity } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { opportunityTypeLabel } from '@/lib/labels'

export function OpportunityCard({
  opportunity,
  company,
  onClick,
}: {
  opportunity: Opportunity
  company: Company | undefined
  onClick: () => void
}) {
  const draggable = opportunity.status === 'open'
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    disabled: !draggable,
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      onClick={onClick}
      className={cn(
        'cursor-pointer select-none rounded-md border border-border bg-surface p-3 shadow-sm transition-colors hover:border-border-strong',
        isDragging && 'opacity-50',
        !draggable && 'cursor-default',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text leading-tight">{opportunity.name}</p>
        {!draggable && <Lock className="h-3.5 w-3.5 shrink-0 text-text-faint" />}
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-xs text-text-faint">
        <Building2 className="h-3 w-3" />
        <span className="truncate">{company?.name ?? '—'}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-text">{formatCurrency(opportunity.amount, opportunity.currency)}</span>
        {opportunity.riskLevel && (opportunity.riskLevel === 'high' || opportunity.riskLevel === 'medium') && (
          <AlertTriangle className={cn('h-3.5 w-3.5', opportunity.riskLevel === 'high' ? 'text-danger' : 'text-warning')} />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{opportunityTypeLabel[opportunity.type] ?? opportunity.type}</Badge>
        {opportunity.status === 'lost' && <Badge variant="danger">Perdida</Badge>}
        {opportunity.status === 'won' && <Badge variant="accent">Ganha</Badge>}
        {opportunity.expectedCloseDate && opportunity.status === 'open' && (
          <span className="text-[11px] text-text-faint">{formatDate(opportunity.expectedCloseDate)}</span>
        )}
      </div>
    </div>
  )
}
