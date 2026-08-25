import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut, Moon, Sun, Building2, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { useCompanies, useContacts } from '@/hooks/queries'
import { useCurrentMember } from '@/hooks/use-current-member'
import { MobileNav } from './mobile-nav'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { initials } from '@/lib/utils'

export function Topbar() {
  const { workspace, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const member = useCurrentMember()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const { data: companies } = useCompanies()
  const { data: contacts } = useContacts()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { companies: [], contacts: [] }
    return {
      companies: (companies ?? []).filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5),
      contacts: (contacts ?? [])
        .filter((c) => `${c.firstName} ${c.lastName ?? ''}`.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
        .slice(0, 5),
    }
  }, [query, companies, contacts])

  const hasResults = results.companies.length > 0 || results.contacts.length > 0

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-topbar px-4">
      <MobileNav />
      <Popover open={query.trim().length > 0 && hasResults}>
        <PopoverTrigger asChild>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empresas, contatos..."
              className="pl-8"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-1">
          {results.companies.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1 text-[11px] font-medium uppercase text-text-faint">Empresas</p>
              {results.companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    navigate(`/companies/${c.id}`)
                    setQuery('')
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-text hover:bg-surface-hover"
                >
                  <Building2 className="h-3.5 w-3.5 text-text-faint" /> {c.name}
                </button>
              ))}
            </div>
          )}
          {results.contacts.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] font-medium uppercase text-text-faint">Contatos</p>
              {results.contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    navigate(`/contacts/${c.id}`)
                    setQuery('')
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-text hover:bg-surface-hover"
                >
                  <UserIcon className="h-3.5 w-3.5 text-text-faint" /> {c.firstName} {c.lastName ?? ''}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <div className="flex-1" />

      {workspace && (
        <span className="hidden lg:inline text-xs text-text-faint truncate max-w-[160px]">{workspace.name}</span>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text">
            <Bell className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72">
          <p className="text-sm font-medium text-text mb-1">Notificações</p>
          <p className="text-sm text-text-faint">Nenhuma notificação agora.</p>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none">
            <Avatar>
              <AvatarFallback>{initials(member?.name)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{member?.name ?? 'Minha conta'}</DropdownMenuLabel>
          <p className="px-2 pb-2 text-xs text-text-faint truncate">{member?.email}</p>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={toggleTheme}>
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={logout} className="text-danger focus:bg-danger/10">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
