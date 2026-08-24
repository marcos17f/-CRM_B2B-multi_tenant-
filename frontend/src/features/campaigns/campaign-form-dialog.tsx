import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Campaign } from '@/api/types'
import { useCreateCampaign, useUpdateCampaign } from '@/hooks/queries'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { extractErrorMessage } from '@/lib/utils'
import { campaignStatusLabel, campaignTypeLabel } from '@/lib/labels'

const schema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  type: z.enum(['outbound', 'email', 'ads', 'event', 'referral', 'other']),
  status: z.enum(['draft', 'active', 'paused', 'ended']),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  budget: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function CampaignFormDialog({
  open,
  onOpenChange,
  campaign,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign
}) {
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()
  const isEdit = !!campaign

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: 'outbound', status: 'draft' } })

  useEffect(() => {
    if (open) {
      reset({
        name: campaign?.name ?? '',
        type: (campaign?.type as FormValues['type']) ?? 'outbound',
        status: (campaign?.status as FormValues['status']) ?? 'draft',
        startsAt: campaign?.startsAt?.slice(0, 10) ?? '',
        endsAt: campaign?.endsAt?.slice(0, 10) ?? '',
      })
    }
  }, [open, campaign, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        ...values,
        startsAt: values.startsAt || undefined,
        endsAt: values.endsAt || undefined,
        budget: values.budget ? Number(values.budget) : undefined,
      }
      if (isEdit) {
        await updateCampaign.mutateAsync({ id: campaign.id, payload })
        toast.success('Campanha atualizada.')
      } else {
        await createCampaign.mutateAsync(payload)
        toast.success('Campanha criada.')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar campanha' : 'Nova campanha'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
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
                      {Object.entries(campaignTypeLabel).map(([value, label]) => (
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
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(campaignStatusLabel).map(([value, label]) => (
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
              <Label htmlFor="startsAt">Início</Label>
              <Input id="startsAt" type="date" {...register('startsAt')} />
            </div>
            <div>
              <Label htmlFor="endsAt">Fim</Label>
              <Input id="endsAt" type="date" {...register('endsAt')} />
            </div>
          </div>
          <div>
            <Label htmlFor="budget">Orçamento (BRL)</Label>
            <Input id="budget" type="number" min={0} step="0.01" {...register('budget')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar campanha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
