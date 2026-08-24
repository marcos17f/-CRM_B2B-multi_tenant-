import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCompanies, useContacts, useCreateOpportunity } from '@/hooks/queries'
import type { Pipeline } from '@/api/types'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { extractErrorMessage } from '@/lib/utils'
import { opportunityTypeLabel } from '@/lib/labels'

const schema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  companyId: z.string().uuid('Selecione uma empresa'),
  primaryContactId: z.string().optional(),
  stageId: z.string().uuid('Selecione um estágio'),
  type: z.enum(['new_business', 'upsell', 'renewal']),
  amount: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  season: z.string().optional(),
  cropType: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function OpportunityFormDialog({
  open,
  onOpenChange,
  pipeline,
  defaultStageId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipeline: Pipeline
  defaultStageId: string
}) {
  const { data: companies } = useCompanies()
  const createOpportunity = useCreateOpportunity()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'new_business', stageId: defaultStageId },
  })

  const companyId = watch('companyId')
  const { data: contacts } = useContacts(companyId)

  async function onSubmit(values: FormValues) {
    try {
      await createOpportunity.mutateAsync({
        name: values.name,
        companyId: values.companyId,
        primaryContactId: values.primaryContactId || undefined,
        pipelineId: pipeline.id,
        stageId: values.stageId,
        type: values.type,
        amount: values.amount ? Number(values.amount) : undefined,
        expectedCloseDate: values.expectedCloseDate || undefined,
        season: values.season || undefined,
        cropType: values.cropType || undefined,
      })
      toast.success('Oportunidade criada.')
      reset()
      onOpenChange(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova oportunidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>

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

          {companyId && (contacts?.length ?? 0) > 0 && (
            <div>
              <Label>Contato principal (opcional)</Label>
              <Controller
                control={control}
                name="primaryContactId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sem contato definido" />
                    </SelectTrigger>
                    <SelectContent>
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
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estágio</Label>
              <Controller
                control={control}
                name="stageId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pipeline.stages
                        .filter((s) => s.stageType === 'open')
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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
                      {Object.entries(opportunityTypeLabel).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              <Label htmlFor="amount">Valor (BRL)</Label>
              <Input id="amount" type="number" min={0} step="0.01" {...register('amount')} />
            </div>
            <div>
              <Label htmlFor="expectedCloseDate">Previsão de fechamento</Label>
              <Input id="expectedCloseDate" type="date" {...register('expectedCloseDate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="season">Safra (opcional)</Label>
              <Input id="season" placeholder="2026/2027" {...register('season')} />
            </div>
            <div>
              <Label htmlFor="cropType">Cultura (opcional)</Label>
              <Input id="cropType" placeholder="soja, milho..." {...register('cropType')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar oportunidade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
