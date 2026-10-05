import { fetchInitialData } from '@/app/dashboard/macroeconomia/cadastro/actions'
import { RiskChartWidget } from '@/components/RiskChartWidget'
import { FairValueWidget } from '@/components/FairValueWidget'
import { AggressionChartWidget } from '@/components/AggressionChartWidget'
import { RightSidebar } from '@/components/RightSidebar'

import { FullscreenWrapper } from '@/components/FullscreenWrapper'

export default async function DashboardPage() {
  const grupos: any = await fetchInitialData()

  return (
    <FullscreenWrapper rightSidebar={<RightSidebar grupos={grupos} />}>
      {/* Layout Principal em 2 Colunas */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 w-full items-stretch">
        {/* Coluna 1 (Esquerda): Saldo de Agressão dos Players */}
        <div className="w-full h-full">
          <AggressionChartWidget />
        </div>

        {/* Coluna 2 (Direita): Preço Justo em cima, Risk embaixo */}
        <div className="flex flex-col gap-4 w-full">
          <FairValueWidget />
          <RiskChartWidget />
        </div>
      </div>
    </FullscreenWrapper>
  )
}
