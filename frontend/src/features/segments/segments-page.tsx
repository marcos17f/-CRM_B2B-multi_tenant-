import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Layers, Trash2, Users } from 'lucide-react'
import type { Segment } from '@/api/types'
import { useSegments, useDeleteSegment } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { PermissionGate } from '@/components/permission-gate'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, extractErrorMessage } from '@/lib/utils'
import { SegmentFormDialog } from './segment-form-dialog'
import { SegmentMembersSheet } from './segment-members-sheet'

export function SegmentsPage() {
  const { data: segments, isLoading } = useSegments()
  const deleteSegment = useDeleteSegment()
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Segment | null>(null)

  function handleDelete(e: React.MouseEvent, segment: Segment) {
    e.stopPropagation()
    if (!confirm(`Excluir o segmento "${segment.name}"?`)) return
    deleteSegment.mutate(segment.id, {
      onSuccess: () => toast.success('Segmento excluído.'),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <div>
      <PageHeader
        title="Segmentos"
        description="Grupos de empresas — manuais ou recalculados automaticamente por critério (ex.: segmento RFM)"
        actions={
          <PermissionGate permission="segments:write">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Novo segmento
            </Button>
          </PermissionGate>
        }
      />

      <div className="p-6 space-y-4">
        {isLoading && <Skeleton className="h-64 w-full" />}

        {!isLoading && (segments?.length ?? 0) === 0 && (
          <EmptyState icon={Layers} title="Nenhum segmento criado" description="Crie um segmento manual ou smart pra agrupar empresas." />
        )}

        {!isLoading && (segments?.length ?? 0) > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments!.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s)}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant={s.type === 'smart' ? 'blue' : 'outline'}>{s.type === 'smart' ? 'Smart' : 'Manual'}</Badge>
                  </TableCell>
                  <TableCell className="text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {s.memberCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-muted">{formatDate(s.createdAt)}</TableCell>
                  <TableCell>
                    <PermissionGate permission="segments:write">
                      <Button size="icon" variant="ghost" onClick={(e) => handleDelete(e, s)}>
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <SegmentFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <SegmentMembersSheet segment={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}
