import { fetchInitialData } from '@/app/dashboard/macroeconomia/cadastro/actions'
import { RiskChartWidget } from '@/components/RiskChartWidget'
import { FairValueWidget } from '@/components/FairValueWidget'
import { OperationalRulerWidget } from '@/components/OperationalRulerWidget'
import { AggressionChartWidget } from '@/components/AggressionChartWidget'
import { RightSidebar } from '@/components/RightSidebar'

export default async function DashboardPage() {
  const grupos: any = await fetchInitialData()

  return (
    <div className="flex gap-6 h-full">
      {/* Main Column (Clean Workspace) */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-10">
        {/* Linha 1: Indicadores de Risco + Preço Justo */}
        <div className="grid grid-cols-2 gap-6 w-full items-start">
          {/* Card 1: Indicadores de Risco + Gráfico (50% da largura) */}
          <RiskChartWidget />

          {/* Card 2: Preço Justo do Dólar (50% da largura) */}
          <FairValueWidget />
        </div>

        {/* Linha 2: Saldo de Agressão dos Players (Largura Total) */}
        <div className="w-full">
          <AggressionChartWidget />
        </div>
        
        {/* Linha 3: Régua Operacional */}
        <div className="grid grid-cols-2 gap-6 w-full items-start">
          <div className="col-span-1">
            <OperationalRulerWidget />
          </div>
        </div>
      </div>

      {/* Right Sidebar Column (Collapsible) */}
      <RightSidebar grupos={grupos} />
    </div>
  )
}
