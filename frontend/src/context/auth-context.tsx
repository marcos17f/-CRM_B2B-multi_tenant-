import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type LoginPayload, type RegisterPayload } from '@/api/auth'
import { refreshAccessToken } from '@/api/client'
import { workspacesApi } from '@/api/workspaces'
import type { LoginResponse, Workspace, WorkspaceSelectionRequired } from '@/api/types'
import { tokenStore } from '@/lib/token-store'

interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  workspace: Workspace | null
  permissions: string[]
  roleId: string | null
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<LoginResponse>
  register: (payload: RegisterPayload) => Promise<void>
  selectWorkspace: (preAuthToken: string, workspace: { id: string; name: string; slug: string }) => Promise<void>
  acceptInvite: (inviteToken: string, password: string, name?: string) => Promise<void>
  logout: () => void
  hasPermission: (required: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function checkPermission(permissions: string[], required: string) {
  if (permissions.includes('*')) return true
  if (permissions.includes(required)) return true
  const resource = required.split(':')[0]
  return permissions.includes(`${resource}:*`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    workspace: null,
    permissions: [],
    roleId: null,
  })

  const loadWorkspaceContext = useCallback(async () => {
    const me = await workspacesApi.me()
    tokenStore.setWorkspace({ id: me.workspace.id, name: me.workspace.name, slug: me.workspace.slug })
    setState({ status: 'authenticated', workspace: me.workspace, permissions: me.permissions, roleId: me.roleId })
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const refreshToken = tokenStore.getRefreshToken()
      if (!refreshToken) {
        if (!cancelled) setState((s) => ({ ...s, status: 'unauthenticated' }))
        return
      }
      const token = await refreshAccessToken()
      if (cancelled) return
      if (!token) {
        setState((s) => ({ ...s, status: 'unauthenticated' }))
        return
      }
      try {
        await loadWorkspaceContext()
      } catch {
        if (!cancelled) {
          tokenStore.clear()
          setState((s) => ({ ...s, status: 'unauthenticated' }))
        }
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [loadWorkspaceContext])

  useEffect(() => {
    return tokenStore.subscribe(() => {
      if (!tokenStore.getAccessToken()) {
        setState({ status: 'unauthenticated', workspace: null, permissions: [], roleId: null })
      }
    })
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload)
    if ('requiresWorkspaceSelection' in result) return result as WorkspaceSelectionRequired
    tokenStore.setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken }, result.workspace)
    await loadWorkspaceContext()
    return result
  }, [loadWorkspaceContext])

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await authApi.register(payload)
    tokenStore.setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken }, result.workspace)
    await loadWorkspaceContext()
  }, [loadWorkspaceContext])

  const selectWorkspace = useCallback(
    async (preAuthToken: string, workspace: { id: string; name: string; slug: string }) => {
      const tokens = await authApi.selectWorkspace({ preAuthToken, workspaceId: workspace.id })
      tokenStore.setSession(tokens, workspace)
      await loadWorkspaceContext()
    },
    [loadWorkspaceContext],
  )

  const acceptInvite = useCallback(
    async (inviteToken: string, password: string, name?: string) => {
      const tokens = await authApi.acceptInvite({ inviteToken, password, name })
      tokenStore.setAccessToken(tokens.accessToken)
      tokenStore.setRefreshToken(tokens.refreshToken)
      await loadWorkspaceContext()
    },
    [loadWorkspaceContext],
  )

  const logout = useCallback(() => {
    tokenStore.clear()
    setState({ status: 'unauthenticated', workspace: null, permissions: [], roleId: null })
  }, [])

  const hasPermission = useCallback((required: string) => checkPermission(state.permissions, required), [state.permissions])

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, selectWorkspace, acceptInvite, logout, hasPermission }),
    [state, login, register, selectWorkspace, acceptInvite, logout, hasPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
