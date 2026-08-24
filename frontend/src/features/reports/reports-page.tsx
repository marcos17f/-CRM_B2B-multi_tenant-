import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { BarChart3, RefreshCw, Sprout, TrendingUp } from 'lucide-react'
import { useRfmList, useRecomputeRfm, useTopCustomers, useSeasonality } from '@/hooks/queries'
import { PageHeader } from '@/components/page-header'
import { PermissionGate } from '@/components/permission-gate'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, extractErrorMessage } from '@/lib/utils'
import { rfmSegmentLabel } from '@/lib/labels'
import { PerformanceTab } from './performance-tab'

const SEGMENT_VARIANT: Record<string, 'accent' | 'blue' | 'warning' | 'danger' | 'outline'> = {
  campeoes: 'accent',
  fieis: 'blue',
  novos: 'blue',
  em_risco: 'warning',
  perdidos: 'danger',
  precisa_atencao: 'outline',
}

function RfmSection() {
  const [segment, setSegment] = useState<string>('all')
  const { data: rows, isLoading } = useRfmList(segment === 'all' ? {} : { segment })
  const recompute = useRecomputeRfm()

  function handleRecompute() {
    recompute.mutate(undefined, {
      onSuccess: (result) => toast.success(`RFM recalculado: ${result.companiesScored} empresa(s).`),
      onError: (err) => toast.error(extractErrorMessage(err)),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" /> RFM — Recência, Frequência, Valor
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os segmentos</SelectItem>
              {Object.entries(rfmSegmentLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PermissionGate permission="reports:read">
            <Button size="sm" variant="secondary" onClick={handleRecompute} disabled={recompute.isPending}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recompute.isPending ? 'animate-spin' : ''}`} /> Recalcular
            </Button>
          </PermissionGate>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && <Skeleton className="h-48 w-full m-4" />}
        {!isLoading && (rows?.length ?? 0) === 0 && (
          <div className="p-4">
            <EmptyState
              title="Nenhum dado de RFM ainda"
              description='Clique em "Recalcular" — o RFM considera Opportunities ganhas nos últimos 12 meses.'
            />
          </div>
        )}
        {!isLoading && (rows?.length ?? 0) > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Recência</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Última compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows!.map((row) => (
                <TableRow key={row.companyId}>
                  <TableCell className="font-medium">
                    <Link to={`/companies/${row.companyId}`} className="hover:text-accent">
                      {row.companyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={SEGMENT_VARIANT[row.rfmSegment] ?? 'outline'}>{rfmSegmentLabel[row.rfmSegment] ?? row.rfmSegment}</Badge>
                  </TableCell>
                  <TableCell className="text-text-muted">{row.recencyScore}/5 ({row.recencyDays}d)</TableCell>
                  <TableCell className="text-text-muted">{row.frequencyScore}/5 ({row.frequencyCount}x)</TableCell>
                  <TableCell className="text-text-muted">{row.monetaryScore}/5 ({formatCurrency(row.monetaryTotal)})</TableCell>
                  <TableCell className="text-text-faint">{row.lastPurchaseAt ? new Date(row.lastPurchaseAt).toLocaleDateString('pt-BR') : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function TopCustomersSection() {
  const [lifetime, setLifetime] = useState(false)
  const { data, isLoading } = useTopCustomers(10, lifetime)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" /> Priorização de clientes
        </CardTitle>
        <Select value={lifetime ? 'lifetime' : 'window'} onValueChange={(v) => setLifetime(v === 'lifetime')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="window">Últimos 12 meses</SelectItem>
            <SelectItem value="lifetime">Histórico total</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-48 w-full" />}
        {!isLoading && data && (
          <>
            <p className="text-sm text-text-muted mb-3">
              Top {data.customers.length} clientes representam{' '}
              <span className="font-semibold text-text">{data.percentOfTotalRevenue}%</span> do faturamento ({formatCurrency(data.topRevenue)} de{' '}
              {formatCurrency(data.totalRevenue)}).
            </p>
            {data.customers.length === 0 ? (
              <EmptyState title="Sem dados ainda" description="Recalcule o RFM na seção acima primeiro." />
            ) : (
              <ol className="space-y-2">
                {data.customers.map((c, i) => (
                  <li key={c.companyId} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-faint w-5">{i + 1}º</span>
                      <Link to={`/companies/${c.companyId}`} className="text-sm font-medium text-text hover:text-accent">
                        {c.companyName}
                      </Link>
                    </div>
                    <span className="text-sm text-text-muted">{formatCurrency(c.lifetimeMonetaryTotal ?? c.monetaryTotal ?? '0')}</span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SeasonalitySection() {
  const { data, isLoading } = useSeasonality()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sprout className="h-4 w-4 text-accent" /> Sazonalidade agrícola
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && <Skeleton className="h-32 w-full m-4" />}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="p-4">
            <EmptyState title="Nenhuma safra registrada" description='Preencha "Safra" e "Cultura" nas Oportunidades pra ver o faturamento por época do ano aqui.' />
          </div>
        )}
        {!isLoading && (data?.length ?? 0) > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Safra</TableHead>
                <TableHead>Cultura</TableHead>
                <TableHead>Oportunidades</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ganho</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data!.map((row) => (
                <TableRow key={`${row.season}-${row.cropType}`}>
                  <TableCell className="font-medium">{row.season}</TableCell>
                  <TableCell className="text-text-muted">{row.cropType ?? '—'}</TableCell>
                  <TableCell className="text-text-muted">{row.opportunityCount}</TableCell>
                  <TableCell className="text-text-muted">{formatCurrency(row.totalAmount)}</TableCell>
                  <TableCell className="text-accent">{formatCurrency(row.wonAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export function ReportsPage() {
  return (
    <div>
      <PageHeader title="Relatórios" description="Performance de vendas, RFM, priorização de clientes e sazonalidade agrícola" />
      <div className="p-6">
        <Tabs defaultValue="performance">
          <TabsList>
            <TabsTrigger value="performance">Performance de Vendas</TabsTrigger>
            <TabsTrigger value="rfm">RFM &amp; Sazonalidade</TabsTrigger>
          </TabsList>
          <TabsContent value="performance">
            <PerformanceTab />
          </TabsContent>
          <TabsContent value="rfm" className="space-y-4">
            <RfmSection />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopCustomersSection />
              <SeasonalitySection />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
