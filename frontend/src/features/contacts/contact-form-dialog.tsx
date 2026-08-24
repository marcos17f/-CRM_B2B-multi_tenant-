import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Contact } from '@/api/types'
import { useCompanies, useCreateContact, useUpdateContact } from '@/hooks/queries'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { extractErrorMessage } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().min(1, 'Informe o nome'),
  lastName: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  companyId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  defaultCompanyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact
  defaultCompanyId?: string
}) {
  const { data: companies } = useCompanies()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const isEdit = !!contact

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset({
        firstName: contact?.firstName ?? '',
        lastName: contact?.lastName ?? '',
        email: contact?.email ?? '',
        phone: contact?.phone ?? '',
        title: contact?.title ?? '',
        companyId: contact?.companyId ?? defaultCompanyId ?? undefined,
      })
    }
  }, [open, contact, defaultCompanyId, reset])

  async function onSubmit(values: FormValues) {
    const payload = { ...values, email: values.email || undefined }
    try {
      if (isEdit) {
        await updateContact.mutateAsync({ id: contact.id, payload })
        toast.success('Contato atualizado.')
      } else {
        await createContact.mutateAsync(payload)
        toast.success('Contato criado.')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Não foi possível salvar o contato.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar contato' : 'Novo contato'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">Nome</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="mt-1 text-xs text-danger">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input id="lastName" {...register('lastName')} />
            </div>
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div>
              <Label htmlFor="title">Cargo</Label>
              <Input id="title" {...register('title')} />
            </div>
          </div>
          <div>
            <Label>Empresa</Label>
            <Controller
              control={control}
              name="companyId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {(companies ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar contato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
