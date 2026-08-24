import { useState } from 'react'
import { CheckCircle2, Circle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCompleteTask, useCreateTask, useTasks } from '@/hooks/queries'
import type { RelatedToType } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PermissionGate } from '@/components/permission-gate'
import { formatDate, extractErrorMessage, cn } from '@/lib/utils'

export function TaskList({ relatedToType, relatedToId }: { relatedToType: RelatedToType; relatedToId: string }) {
  const { data: tasks, isLoading } = useTasks({ relatedToType, relatedToId })
  const createTask = useCreateTask()
  const completeTask = useCompleteTask()
  const [subject, setSubject] = useState('')
  const [dueDate, setDueDate] = useState('')

  function addTask() {
    if (!subject.trim()) return
    createTask.mutate(
      { subject, relatedToType, relatedToId, dueDate: dueDate || undefined },
      {
        onSuccess: () => {
          setSubject('')
          setDueDate('')
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  const pending = (tasks ?? []).filter((t) => t.status === 'pending')
  const completed = (tasks ?? []).filter((t) => t.status === 'completed')

  return (
    <div className="space-y-3">
      <PermissionGate permission="tasks:write">
        <div className="flex gap-2">
          <Input placeholder="Nova tarefa..." value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Input type="date" className="w-40" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Button size="icon" variant="secondary" onClick={addTask} disabled={createTask.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </PermissionGate>

      {isLoading && <Skeleton className="h-16 w-full" />}

      {!isLoading && (tasks?.length ?? 0) === 0 && <EmptyState title="Nenhuma tarefa" />}

      {!isLoading && pending.length + completed.length > 0 && (
        <ul className="space-y-1">
          {[...pending, ...completed].map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm bg-surface"
            >
              <button
                onClick={() => completeTask.mutate(task.id)}
                disabled={task.status === 'completed' || completeTask.isPending}
                className="text-text-faint hover:text-accent disabled:hover:text-text-faint"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </button>
              <span className={cn('flex-1', task.status === 'completed' && 'line-through text-text-faint')}>
                {task.subject}
              </span>
              {task.dueDate && <span className="text-xs text-text-faint">{formatDate(task.dueDate)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
