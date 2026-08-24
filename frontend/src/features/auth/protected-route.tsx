import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  if (status === 'unauthenticated') return <Navigate to="/login" replace />

  return <Outlet />
}
