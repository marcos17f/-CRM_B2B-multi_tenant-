import type { ReactNode } from 'react'
import { useAuth } from '@/context/auth-context'

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasPermission } = useAuth()
  if (!hasPermission(permission)) return <>{fallback}</>
  return <>{children}</>
}
