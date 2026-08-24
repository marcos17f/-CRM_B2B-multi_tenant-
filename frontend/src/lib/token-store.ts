import type { Workspace } from '@/api/types'

const REFRESH_TOKEN_KEY = 'marcoslab-refresh-token'
const WORKSPACE_KEY = 'marcoslab-workspace'

let accessToken: string | null = null

type Listener = () => void
const listeners = new Set<Listener>()

function notify() {
  for (const listener of listeners) listener()
}

export const tokenStore = {
  getAccessToken() {
    return accessToken
  },
  setAccessToken(token: string | null) {
    accessToken = token
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setRefreshToken(token: string | null) {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
  getWorkspace(): Workspace | null {
    const raw = localStorage.getItem(WORKSPACE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Workspace
    } catch {
      return null
    }
  },
  setWorkspace(workspace: { id: string; name: string; slug: string } | null) {
    if (workspace) localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace))
    else localStorage.removeItem(WORKSPACE_KEY)
  },
  setSession(tokens: { accessToken: string; refreshToken: string }, workspace: { id: string; name: string; slug: string }) {
    accessToken = tokens.accessToken
    tokenStore.setRefreshToken(tokens.refreshToken)
    tokenStore.setWorkspace(workspace)
    notify()
  },
  clear() {
    accessToken = null
    tokenStore.setRefreshToken(null)
    tokenStore.setWorkspace(null)
    notify()
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
