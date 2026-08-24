import { BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

export function ReportsPage() {
  return (
    <div>
      <PageHeader title="Relatórios" description="Análises detalhadas de vendas e atividade" />
      <div className="p-6">
        <EmptyState
          icon={BarChart3}
          title="Relatórios detalhados em construção"
          description="Ainda não há endpoints de relatórios no backend. Enquanto isso, a Visão Geral traz um resumo do pipeline e do workspace."
          action={
            <Link to="/overview">
              <Button variant="secondary" size="sm">
                Ir para Visão Geral
              </Button>
            </Link>
          }
        />
      </div>
    </div>
  )
}
