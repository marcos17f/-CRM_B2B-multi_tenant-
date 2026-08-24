export interface AccessTokenPayload {
  sub: string
  workspaceId: string
  workspaceMemberId: string
  roleId: string
  permissions: string[]
  exp: number
  iat: number
}

export function decodeJwt<T = AccessTokenPayload>(token: string): T | null {
  try {
    const [, payload] = token.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json))) as T
  } catch {
    return null
  }
}
