import type { ReactNode } from 'react'
import { useAuth } from '@/context/auth-context'

export function PermissionGate({ permission, children }: { permission: string; children: ReactNode }) {
  const { hasPermission } = useAuth()
  if (!hasPermission(permission)) return null
  return <>{children}</>
}
