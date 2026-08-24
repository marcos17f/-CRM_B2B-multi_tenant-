import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, User, Building2 } from 'lucide-react'
import { useCompany, useContact, useDeleteContact } from '@/hooks/queries'
import { PermissionGate } from '@/components/permission-gate'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityTimeline } from '@/components/activity-timeline'
import { TaskList } from '@/components/task-list'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ContactFormDialog } from './contact-form-dialog'
import { extractErrorMessage } from '@/lib/utils'

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: contact, isLoading } = useContact(id)
  const { data: company } = useCompany(contact?.companyId ?? undefined)
  const deleteContact = useDeleteContact()
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) return <Skeleton className="m-6 h-96" />
  if (!contact || !id) return <EmptyState title="Contato não encontrado" />

  function handleDelete() {
    if (!confirm(`Excluir ${contact!.firstName}? Essa ação não pode ser desfeita.`)) return
    deleteContact.mutate(contact!.id, {
      onSuccess: () => {
        toast.success('Contato excluído.')
        navigate('/contacts')
      },
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border">
        <div>
          <Link to="/contacts" className="inline-flex items-center gap-1 text-xs text-text-faint hover:text-text mb-2">
            <ArrowLeft className="h-3 w-3" /> Contatos
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent">
              <User className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold text-text">
              {contact.firstName} {contact.lastName ?? ''}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="contacts:write">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
            </Button>
          </PermissionGate>
          <PermissionGate permission="contacts:delete">
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteContact.isPending}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="activities">
            <TabsList>
              <TabsTrigger value="activities">Atividades</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            </TabsList>
            <TabsContent value="activities">
              <ActivityTimeline relatedToType="contact" relatedToId={id} />
            </TabsContent>
            <TabsContent value="tasks">
              <TaskList relatedToType="contact" relatedToId={id} />
            </TabsContent>
          </Tabs>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Dados do contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-text-faint">E-mail</p>
              <p className="text-text">{contact.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Telefone</p>
              <p className="text-text">{contact.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Cargo</p>
              <p className="text-text">{contact.title ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-faint">Empresa</p>
              {company ? (
                <Link to={`/companies/${company.id}`} className="inline-flex items-center gap-1 text-accent hover:underline">
                  <Building2 className="h-3.5 w-3.5" /> {company.name}
                </Link>
              ) : (
                <p className="text-text">—</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ContactFormDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} />
    </div>
  )
}
