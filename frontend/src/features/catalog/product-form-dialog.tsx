import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Product } from '@/api/types'
import { useCreateProduct, useUpdateProduct } from '@/hooks/queries'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { extractErrorMessage } from '@/lib/utils'
import { productCategoryLabel } from '@/lib/labels'

const schema = z.object({
  sku: z.string().min(1, 'Informe o SKU'),
  name: z.string().min(1, 'Informe o nome'),
  category: z.enum(['machine', 'seed', 'grain', 'part', 'service']),
  unit: z.string().optional(),
  price: z.string().optional(),
  trackStock: z.boolean(),
  stockQuantity: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const isEdit = !!product

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'part', unit: 'un', trackStock: true },
  })

  const category = watch('category')

  useEffect(() => {
    if (open) {
      reset({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        category: (product?.category as FormValues['category']) ?? 'part',
        unit: product?.unit ?? 'un',
        price: product?.price ?? '',
        trackStock: product?.trackStock ?? true,
        stockQuantity: product?.stockQuantity ?? '',
      })
    }
  }, [open, product, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        sku: values.sku,
        name: values.name,
        category: values.category,
        unit: values.unit,
        price: values.price ? Number(values.price) : undefined,
        trackStock: values.trackStock,
      }
      if (isEdit) {
        await updateProduct.mutateAsync({ id: product.id, payload })
        toast.success('Produto atualizado.')
      } else {
        await createProduct.mutateAsync({ ...payload, stockQuantity: values.stockQuantity ? Number(values.stockQuantity) : undefined })
        toast.success('Produto criado.')
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
          <DialogTitle>{isEdit ? 'Editar produto' : 'Novo produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-sku">SKU</Label>
              <Input id="product-sku" {...register('sku')} disabled={isEdit} />
              {errors.sku && <p className="mt-1 text-xs text-danger">{errors.sku.message}</p>}
            </div>
            <div>
              <Label>Categoria</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(productCategoryLabel).map(([value, label]) => (
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
          <div>
            <Label htmlFor="product-name">Nome</Label>
            <Input id="product-name" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="product-unit">Unidade</Label>
              <Input id="product-unit" placeholder="un, kg, h..." {...register('unit')} />
            </div>
            <div>
              <Label htmlFor="product-price">Preço</Label>
              <Input id="product-price" type="number" min={0} step="0.01" {...register('price')} />
            </div>
            {!isEdit && (
              <div>
                <Label htmlFor="product-stock">Estoque inicial</Label>
                <Input id="product-stock" type="number" min={0} step="0.001" disabled={category === 'service'} {...register('stockQuantity')} />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-sm text-text">Controlar estoque</p>
              <p className="text-xs text-text-faint">Desligado por padrão pra serviços</p>
            </div>
            <Controller control={control} name="trackStock" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
