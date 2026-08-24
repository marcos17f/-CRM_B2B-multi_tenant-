import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCompanies, useContacts, useCreateServiceOrder, useEquipmentList, useMembers } from '@/hooks/queries'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { extractErrorMessage } from '@/lib/utils'
import { serviceOrderTypeLabel } from '@/lib/labels'

const NONE = '__none__'

const schema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  contactId: z.string().optional(),
  equipmentId: z.string().optional(),
  type: z.enum(['maintenance', 'repair', 'installation', 'inspection']),
  description: z.string().optional(),
  technicianId: z.string().optional(),
  scheduledDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function ServiceOrderFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createServiceOrder = useCreateServiceOrder()
  const { data: companies } = useCompanies()
  const { data: members } = useMembers()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: 'maintenance' } })

  const companyId = watch('companyId')
  const { data: contacts } = useContacts(companyId || undefined)
  const { data: equipmentList } = useEquipmentList(companyId || undefined)

  useEffect(() => {
    if (open) reset({ companyId: '', contactId: NONE, equipmentId: NONE, type: 'maintenance', description: '', technicianId: NONE, scheduledDate: '' })
  }, [open, reset])

  const activeMembers = useMemo(() => (members ?? []).filter((m) => m.status === 'active'), [members])

  async function onSubmit(values: FormValues) {
    try {
      await createServiceOrder.mutateAsync({
        companyId: values.companyId,
        contactId: values.contactId && values.contactId !== NONE ? values.contactId : undefined,
        equipmentId: values.equipmentId && values.equipmentId !== NONE ? values.equipmentId : undefined,
        type: values.type,
        description: values.description || undefined,
        technicianId: values.technicianId && values.technicianId !== NONE ? values.technicianId : undefined,
        scheduledDate: values.scheduledDate || undefined,
      })
      toast.success('Ordem de serviço criada.')
      onOpenChange(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova ordem de serviço</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label>Empresa</Label>
            <Controller
              control={control}
              name="companyId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
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
            {errors.companyId && <p className="mt-1 text-xs text-danger">{errors.companyId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contato (opcional)</Label>
              <Controller
                control={control}
                name="contactId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!companyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhum</SelectItem>
                      {(contacts ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName ?? ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Equipamento (opcional)</Label>
              <Controller
                control={control}
                name="equipmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!companyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhum</SelectItem>
                      {(equipmentList ?? []).map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(serviceOrderTypeLabel).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Técnico (opcional)</Label>
              <Controller
                control={control}
                name="technicianId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="A definir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>A definir</SelectItem>
                      {activeMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="so-scheduled">Data agendada</Label>
            <Input id="so-scheduled" type="date" {...register('scheduledDate')} />
          </div>

          <div>
            <Label htmlFor="so-description">Descrição</Label>
            <Textarea id="so-description" placeholder="O que precisa ser feito?" {...register('description')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar ordem de serviço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
