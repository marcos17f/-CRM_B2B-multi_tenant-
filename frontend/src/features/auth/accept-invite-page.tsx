import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { AuthLayout } from './auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { extractErrorMessage } from '@/lib/utils'

const schema = z.object({
  name: z.string().optional(),
  password: z.string().min(8, 'Mínimo de 8 caracteres'),
})
type FormValues = z.infer<typeof schema>

export function AcceptInvitePage() {
  const { acceptInvite } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inviteToken = params.get('token') ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    if (!inviteToken) {
      toast.error('Link de convite inválido.')
      return
    }
    try {
      await acceptInvite(inviteToken, values.password, values.name)
      navigate('/inbox')
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Convite inválido ou expirado.'))
    }
  }

  if (!inviteToken) {
    return (
      <AuthLayout title="Convite inválido">
        <p className="text-sm text-text-muted text-center">
          Este link de convite está incompleto. Peça um novo convite a quem administra seu workspace.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Aceitar convite" subtitle="Defina sua senha para entrar no workspace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Seu nome (opcional)</Label>
          <Input id="name" placeholder="Ana Silva" {...register('name')} />
        </div>
        <div>
          <Label htmlFor="password">Crie uma senha</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Aceitar convite e entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
