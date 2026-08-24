import { NavLink } from 'react-router-dom'
import {
  Inbox,
  Megaphone,
  Workflow,
  LayoutDashboard,
  KanbanSquare,
  Users,
  Activity,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/campaigns', label: 'Campanhas', icon: Megaphone },
  { to: '/operations', label: 'Operações', icon: Workflow },
  { to: '/overview', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/boards', label: 'Boards', icon: KanbanSquare },
  { to: '/contacts', label: 'Contatos', icon: Users },
  { to: '/activities', label: 'Atividades', icon: Activity },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-black font-bold text-sm">
          M
        </div>
        <span className="font-semibold text-text tracking-tight">MarcosLab</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
