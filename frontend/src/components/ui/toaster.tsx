import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/context/theme-context'

export function Toaster() {
  const { theme } = useTheme()
  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--bg-elevated)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        },
      }}
    />
  )
}
