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
  Layers,
  Package,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const NAV_ITEMS = [
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/campaigns', label: 'Campanhas', icon: Megaphone },
  { to: '/operations', label: 'Operações', icon: Workflow },
  { to: '/overview', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/boards', label: 'Boards', icon: KanbanSquare },
  { to: '/contacts', label: 'Contatos', icon: Users },
  { to: '/catalog', label: 'Catálogo', icon: Package },
  { to: '/segments', label: 'Segmentos', icon: Layers },
  { to: '/activities', label: 'Atividades', icon: Activity },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

/** Lista de navegação compartilhada entre o Sidebar (desktop) e o MobileNav (gaveta em telas pequenas). */
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-surface-hover hover:text-text',
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
