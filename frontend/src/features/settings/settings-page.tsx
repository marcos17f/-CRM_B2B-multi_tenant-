import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useMembers } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { PermissionGate } from '@/components/permission-gate'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InviteMemberDialog } from './invite-member-dialog'
import { initials, formatDate } from '@/lib/utils'
import { memberStatusLabel, roleLabel } from '@/lib/labels'

export function SettingsPage() {
  const { workspace } = useAuth()
  const { data: members, isLoading } = useMembers()
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <div>
      <PageHeader title="Configurações" description="Workspace e membros" />

      <div className="p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-text-faint">Nome</p>
              <p className="text-text">{workspace?.name}</p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Slug</p>
              <p className="text-text">{workspace?.slug}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
            <PermissionGate permission="members:manage">
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Convidar
              </Button>
            </PermissionGate>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && <Skeleton className="h-40 w-full m-4" />}
            {!isLoading && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(members ?? []).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">{initials(m.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{m.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted">{m.email}</TableCell>
                      <TableCell className="text-text-muted">{roleLabel[m.roleName] ?? m.roleName}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === 'active' ? 'accent' : m.status === 'invited' ? 'warning' : 'default'}>
                          {memberStatusLabel[m.status] ?? m.status}
                        </Badge>
                        {m.joinedAt && <span className="ml-2 text-[11px] text-text-faint">desde {formatDate(m.joinedAt)}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
