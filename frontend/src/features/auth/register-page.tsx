import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { AuthLayout } from './auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { extractErrorMessage } from '@/lib/utils'

const schema = z.object({
  workspaceName: z.string().min(2, 'Mínimo de 2 caracteres'),
  workspaceSlug: z
    .string()
    .regex(/^[a-z0-9-]{3,63}$/, 'Use letras minúsculas, números e hífen (3-63 caracteres)'),
  name: z.string().min(2, 'Mínimo de 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo de 8 caracteres'),
})
type FormValues = z.infer<typeof schema>

const ACCENTED = 'áàâãäåéèêëíìîïóòôõöúùûüçñ'
const PLAIN = 'aaaaaaeeeeiiiiooooouuuucn'

function stripAccents(value: string) {
  return value
    .split('')
    .map((char) => {
      const idx = ACCENTED.indexOf(char)
      return idx === -1 ? char : PLAIN[idx]
    })
    .join('')
}

function slugify(value: string) {
  return stripAccents(value.toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 63)
}

export function RegisterPage() {
  const { register: doRegister } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const workspaceName = watch('workspaceName')

  async function onSubmit(values: FormValues) {
    try {
      await doRegister(values)
      navigate('/inbox')
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Não foi possível criar sua conta.'))
    }
  }

  return (
    <AuthLayout title="Criar workspace" subtitle="Comece a usar o MarcosLab agora">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="workspaceName">Nome do workspace</Label>
          <Input
            id="workspaceName"
            placeholder="Minha Empresa"
            {...register('workspaceName', {
              onChange: (e) => setValue('workspaceSlug', slugify(e.target.value)),
            })}
          />
          {errors.workspaceName && <p className="mt-1 text-xs text-danger">{errors.workspaceName.message}</p>}
        </div>
        <div>
          <Label htmlFor="workspaceSlug">Slug</Label>
          <Input id="workspaceSlug" placeholder={slugify(workspaceName ?? '') || 'minha-empresa'} {...register('workspaceSlug')} />
          {errors.workspaceSlug && <p className="mt-1 text-xs text-danger">{errors.workspaceSlug.message}</p>}
        </div>
        <div>
          <Label htmlFor="name">Seu nome</Label>
          <Input id="name" placeholder="Ana Silva" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="voce@empresa.com" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Criando...' : 'Criar workspace'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-text-faint">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
