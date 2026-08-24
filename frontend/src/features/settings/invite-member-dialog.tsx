import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { useInviteMember } from '@/hooks/queries'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { extractErrorMessage } from '@/lib/utils'
import { roleLabel } from '@/lib/labels'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().optional(),
  roleName: z.enum(['admin', 'sales_rep', 'read_only']),
})
type FormValues = z.infer<typeof schema>

export function InviteMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const inviteMember = useInviteMember()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { roleName: 'sales_rep' } })

  async function onSubmit(values: FormValues) {
    try {
      const result = await inviteMember.mutateAsync(values)
      setInviteUrl(result.inviteUrl)
      toast.success('Convite criado.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  function close(next: boolean) {
    if (!next) {
      reset()
      setInviteUrl(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>O envio de e-mail ainda não está automatizado — copie o link e envie manualmente.</DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-3">
            <Label>Link do convite</Label>
            <div className="flex gap-2">
              <Input readOnly value={inviteUrl} />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl)
                  toast.success('Link copiado.')
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => close(false)}>Concluir</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input id="name" {...register('name')} />
            </div>
            <div>
              <Label>Role</Label>
              <Controller
                control={control}
                name="roleName"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['admin', 'sales_rep', 'read_only'] as const).map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabel[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => close(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Convidando...' : 'Convidar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
