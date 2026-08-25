import { NavLinks } from './nav-links'

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-black font-bold text-sm">
          M
        </div>
        <span className="font-semibold text-text tracking-tight">MarcosLab</span>
      </div>
      <NavLinks />
    </aside>
  )
}
