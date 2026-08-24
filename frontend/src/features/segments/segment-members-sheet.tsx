import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { RefreshCw, Trash2, UserPlus } from 'lucide-react'
import type { Segment } from '@/api/types'
import {
  useSegmentMembers,
  useAddSegmentMember,
  useRemoveSegmentMember,
  useRecomputeSegment,
  useCompanies,
} from '@/hooks/queries'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/empty-state'
import { PermissionGate } from '@/components/permission-gate'
import { formatDate, extractErrorMessage } from '@/lib/utils'

export function SegmentMembersSheet({ segment, onOpenChange }: { segment: Segment | null; onOpenChange: (open: boolean) => void }) {
  const { data: members } = useSegmentMembers(segment?.id)
  const { data: companies } = useCompanies()
  const addMember = useAddSegmentMember()
  const removeMember = useRemoveSegmentMember()
  const recompute = useRecomputeSegment()
  const [pickedCompany, setPickedCompany] = useState<string | undefined>(undefined)

  const memberIds = useMemo(() => new Set((members ?? []).map((m) => m.id)), [members])
  const availableCompanies = useMemo(() => (companies ?? []).filter((c) => !memberIds.has(c.id)), [companies, memberIds])

  if (!segment) return null

  function handleAdd() {
    if (!pickedCompany) return
    addMember.mutate(
      { id: segment!.id, companyId: pickedCompany },
      {
        onSuccess: () => {
          toast.success('Empresa adicionada.')
          setPickedCompany(undefined)
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      },
    )
  }

  function handleRemove(companyId: string) {
    removeMember.mutate(
      { id: segment!.id, companyId },
      { onSuccess: () => toast.success('Empresa removida.'), onError: (err) => toast.error(extractErrorMessage(err)) },
    )
  }

  function handleRecompute() {
    recompute.mutate(segment!.id, {
      onSuccess: (result) => toast.success(`Recalculado: ${result.memberCount} empresa(s).`),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <Sheet open={!!segment} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{segment.name}</SheetTitle>
            <Badge variant={segment.type === 'smart' ? 'blue' : 'outline'}>{segment.type === 'smart' ? 'Smart' : 'Manual'}</Badge>
          </div>
        </SheetHeader>

        {segment.type === 'smart' && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-border bg-bg-subtle p-3">
            <p className="text-xs text-text-muted">Membros recalculados a partir do critério salvo.</p>
            <PermissionGate permission="segments:write">
              <Button size="sm" variant="secondary" onClick={handleRecompute} disabled={recompute.isPending}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Recalcular
              </Button>
            </PermissionGate>
          </div>
        )}

        {segment.type === 'manual' && (
          <PermissionGate permission="segments:write">
            <div className="mb-4 flex items-center gap-2">
              <Select value={pickedCompany} onValueChange={setPickedCompany}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAdd} disabled={!pickedCompany || addMember.isPending}>
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </PermissionGate>
        )}

        {(members?.length ?? 0) === 0 ? (
          <EmptyState title="Nenhuma empresa neste segmento" />
        ) : (
          <ul className="divide-y divide-border">
            {members!.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5">
                <div>
                  <Link to={`/companies/${m.id}`} className="text-sm font-medium text-text hover:text-accent">
                    {m.name}
                  </Link>
                  <p className="text-xs text-text-faint">
                    {m.industry ?? '—'} · adicionada em {formatDate(m.addedAt)}
                  </p>
                </div>
                {segment.type === 'manual' && (
                  <PermissionGate permission="segments:write">
                    <Button size="icon" variant="ghost" onClick={() => handleRemove(m.id)} disabled={removeMember.isPending}>
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </PermissionGate>
                )}
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
