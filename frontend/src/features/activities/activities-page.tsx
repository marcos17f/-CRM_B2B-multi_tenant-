import { useMemo, useState } from 'react'
import { Building2, User, Target, Search } from 'lucide-react'
import { useCompanies, useContacts, useOpportunities } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Input } from '@/components/ui/input'
import { ActivityTimeline } from '@/components/activity-timeline'
import type { RelatedToType } from '@/api/types'
import { cn } from '@/lib/utils'

type Entry = { type: RelatedToType; id: string; label: string; sublabel?: string }

export function ActivitiesPage() {
  const { data: companies } = useCompanies()
  const { data: contacts } = useContacts()
  const { data: opportunities } = useOpportunities()

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Entry | null>(null)

  const entries: Entry[] = useMemo(() => {
    const companyEntries = (companies ?? []).map((c) => ({ type: 'company' as const, id: c.id, label: c.name, sublabel: 'Empresa' }))
    const contactEntries = (contacts ?? []).map((c) => ({
      type: 'contact' as const,
      id: c.id,
      label: `${c.firstName} ${c.lastName ?? ''}`.trim(),
      sublabel: 'Contato',
    }))
    const opportunityEntries = (opportunities ?? []).map((o) => ({
      type: 'opportunity' as const,
      id: o.id,
      label: o.name,
      sublabel: 'Oportunidade',
    }))
    return [...companyEntries, ...contactEntries, ...opportunityEntries]
  }, [companies, contacts, opportunities])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries.slice(0, 30)
    return entries.filter((e) => e.label.toLowerCase().includes(q)).slice(0, 30)
  }, [entries, query])

  const ICONS: Record<RelatedToType, typeof Building2> = { company: Building2, contact: User, opportunity: Target }

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar empresa, contato, oportunidade..." className="pl-8" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((entry) => {
            const Icon = ICONS[entry.type]
            const isActive = selected?.id === entry.id && selected.type === entry.type
            return (
              <button
                key={`${entry.type}-${entry.id}`}
                onClick={() => setSelected(entry)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-surface-hover hover:text-text',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1">{entry.label}</span>
                <span className="text-[10px] text-text-faint shrink-0">{entry.sublabel}</span>
              </button>
            )
          })}
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-text-faint">Nada encontrado.</p>}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader
          title="Atividades"
          description={selected ? `Timeline de ${selected.label}` : 'Selecione uma empresa, contato ou oportunidade'}
        />
        <div className="flex-1 overflow-y-auto p-6">
          {selected ? (
            <ActivityTimeline relatedToType={selected.type} relatedToId={selected.id} />
          ) : (
            <EmptyState
              title="Escolha uma entidade"
              description="O histórico de atividades é organizado por empresa, contato ou oportunidade — escolha uma ao lado para ver a timeline."
            />
          )}
        </div>
      </div>
    </div>
  )
}
