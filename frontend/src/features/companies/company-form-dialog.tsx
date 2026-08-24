import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Company } from '@/api/types'
import { useCreateCompany, useUpdateCompany } from '@/hooks/queries'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { extractErrorMessage } from '@/lib/utils'
import { companyStatusLabel } from '@/lib/labels'

const schema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(['prospect', 'customer', 'churned']),
})
type FormValues = z.infer<typeof schema>

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company
}) {
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()
  const isEdit = !!company

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { status: 'prospect' } })

  useEffect(() => {
    if (open) {
      reset({
        name: company?.name ?? '',
        domain: company?.domain ?? '',
        industry: company?.industry ?? '',
        status: (company?.status as FormValues['status']) ?? 'prospect',
      })
    }
  }, [open, company, reset])

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit) {
        await updateCompany.mutateAsync({ id: company.id, payload: values })
        toast.success('Empresa atualizada.')
      } else {
        await createCompany.mutateAsync(values)
        toast.success('Empresa criada.')
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
          <DialogTitle>{isEdit ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="domain">Domínio</Label>
              <Input id="domain" placeholder="empresa.com" {...register('domain')} />
            </div>
            <div>
              <Label htmlFor="industry">Setor</Label>
              <Input id="industry" {...register('industry')} />
            </div>
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
                    {Object.entries(companyStatusLabel).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
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
              {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
