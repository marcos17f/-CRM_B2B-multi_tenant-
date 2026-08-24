import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 px-6 text-center">
      {Icon && (
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover text-text-faint">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="text-sm text-text-faint max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
