import type { ReactNode } from 'react'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-black font-bold">M</div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-text">{title}</h1>
            {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">{children}</div>
      </div>
    </div>
  )
}
