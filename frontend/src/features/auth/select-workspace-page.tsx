import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { AuthLayout } from './auth-layout'
import { extractErrorMessage } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface LocationState {
  preAuthToken: string
  workspaces: { id: string; name: string; slug: string }[]
}

export function SelectWorkspacePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectWorkspace } = useAuth()
  const [pending, setPending] = useState<string | null>(null)

  const state = location.state as LocationState | null
  const invalid = !state?.preAuthToken || !state.workspaces?.length

  useEffect(() => {
    if (invalid) navigate('/login', { replace: true })
  }, [invalid, navigate])

  if (invalid) return null

  async function choose(ws: { id: string; name: string; slug: string }) {
    setPending(ws.id)
    try {
      await selectWorkspace(state!.preAuthToken, ws)
      navigate('/inbox')
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setPending(null)
    }
  }

  return (
    <AuthLayout title="Escolha um workspace" subtitle="Você participa de mais de um workspace">
      <div className="space-y-2">
        {state.workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => choose(ws)}
            disabled={pending !== null}
            className="flex w-full items-center gap-3 rounded-md border border-border bg-bg-subtle px-4 py-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-hover disabled:opacity-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{ws.name}</p>
              <p className="text-xs text-text-faint">{ws.slug}</p>
            </div>
            {pending === ws.id && <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />}
          </button>
        ))}
      </div>
    </AuthLayout>
  )
}
