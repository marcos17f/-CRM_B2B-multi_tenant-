import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCompanies, useCreateEquipment, useProducts } from '@/hooks/queries'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { extractErrorMessage } from '@/lib/utils'

const NONE = '__none__'

const schema = z.object({
  companyId: z.string().min(1, 'Selecione a empresa'),
  productId: z.string().optional(),
  name: z.string().min(1, 'Informe o nome'),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function EquipmentFormDialog({
  open,
  onOpenChange,
  defaultCompanyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCompanyId?: string
}) {
  const createEquipment = useCreateEquipment()
  const { data: companies } = useCompanies()
  const { data: products } = useProducts('machine')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { companyId: defaultCompanyId ?? '' } })

  useEffect(() => {
    if (open) reset({ companyId: defaultCompanyId ?? '', productId: NONE, name: '', manufacturer: '', model: '', serialNumber: '', purchaseDate: '' })
  }, [open, defaultCompanyId, reset])

  async function onSubmit(values: FormValues) {
    try {
      await createEquipment.mutateAsync({
        companyId: values.companyId,
        productId: values.productId && values.productId !== NONE ? values.productId : undefined,
        name: values.name,
        manufacturer: values.manufacturer || undefined,
        model: values.model || undefined,
        serialNumber: values.serialNumber || undefined,
        purchaseDate: values.purchaseDate || undefined,
      })
      toast.success('Equipamento cadastrado.')
      onOpenChange(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo equipamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {!defaultCompanyId && (
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
          )}
          <div>
            <Label>Modelo do catálogo (opcional)</Label>
            <Controller
              control={control}
              name="productId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem referência no catálogo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem referência no catálogo</SelectItem>
                    {(products ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="eq-name">Nome</Label>
            <Input id="eq-name" placeholder='ex.: "Trator da fazenda Boa Vista"' {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="eq-manufacturer">Fabricante</Label>
              <Input id="eq-manufacturer" {...register('manufacturer')} />
            </div>
            <div>
              <Label htmlFor="eq-model">Modelo</Label>
              <Input id="eq-model" {...register('model')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="eq-serial">Nº de série</Label>
              <Input id="eq-serial" {...register('serialNumber')} />
            </div>
            <div>
              <Label htmlFor="eq-purchase">Data de compra</Label>
              <Input id="eq-purchase" type="date" {...register('purchaseDate')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
