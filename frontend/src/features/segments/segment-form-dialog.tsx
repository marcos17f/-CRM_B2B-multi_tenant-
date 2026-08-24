import { useState } from 'react'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateSegment } from '@/hooks/queries'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { extractErrorMessage } from '@/lib/utils'
import { rfmSegmentLabel } from '@/lib/labels'

const SMART_CRITERIA_KEYS = ['rfmSegment', 'industry', 'status'] as const

const schema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  type: z.enum(['manual', 'smart']),
  criteriaKey: z.string().optional(),
  criteriaValue: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function SegmentFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createSegment = useCreateSegment()
  const [type, setType] = useState<'manual' | 'smart'>('manual')

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: 'manual', criteriaKey: 'rfmSegment' } })

  const criteriaKey = watch('criteriaKey')

  function handleOpenChange(next: boolean) {
    if (next) {
      reset({ name: '', type: 'manual', criteriaKey: 'rfmSegment', criteriaValue: '' })
      setType('manual')
    }
    onOpenChange(next)
  }

  async function onSubmit(values: FormValues) {
    try {
      const criteria =
        values.type === 'smart' && values.criteriaKey && values.criteriaValue
          ? { [values.criteriaKey]: values.criteriaValue }
          : undefined
      await createSegment.mutateAsync({ name: values.name, type: values.type, criteria })
      toast.success('Segmento criado.')
      handleOpenChange(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo segmento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="segment-name">Nome</Label>
            <Input id="segment-name" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Tipo</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v)
                    setType(v as 'manual' | 'smart')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (você adiciona empresas à mão)</SelectItem>
                    <SelectItem value="smart">Smart (critério recalculado automaticamente)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {type === 'smart' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Critério</Label>
                <Controller
                  control={control}
                  name="criteriaKey"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SMART_CRITERIA_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key === 'rfmSegment' ? 'Segmento RFM' : key === 'industry' ? 'Setor' : 'Status da empresa'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label>Valor</Label>
                {criteriaKey === 'rfmSegment' ? (
                  <Controller
                    control={control}
                    name="criteriaValue"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(rfmSegmentLabel).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Input {...register('criteriaValue')} placeholder={criteriaKey === 'status' ? 'customer' : 'ex.: SaaS'} />
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar segmento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
