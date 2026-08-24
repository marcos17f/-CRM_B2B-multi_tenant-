import type { PeriodPreset } from '@/lib/analytics'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PRESET_LABEL: Record<PeriodPreset, string> = {
  today: 'Hoje',
  this_week: 'Esta semana',
  this_month: 'Este mês',
  this_quarter: 'Este trimestre',
  last_30_days: 'Últimos 30 dias',
}

export function PeriodFilter({ value, onChange }: { value: PeriodPreset; onChange: (value: PeriodPreset) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PeriodPreset)}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PRESET_LABEL).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
