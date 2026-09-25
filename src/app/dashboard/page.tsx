import { fetchInitialData } from '@/app/dashboard/macroeconomia/cadastro/actions'
import { AssetQuote } from '@/components/AssetQuote'
import { RiskEngineWidget } from '@/components/RiskEngineWidget'
import { RiskChartWidget } from '@/components/RiskChartWidget'

export default async function DashboardPage() {
  const grupos: any = await fetchInitialData()

  return (
    <div className="flex gap-6 h-full">
      {/* Main Column (Clean Workspace) */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-10">
        
        
        <div className="flex-1 bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex flex-col gap-4">
          
          
          <div className="flex gap-4 flex-wrap mt-4">
            <RiskEngineWidget />
          </div>

          <div className="flex w-full mt-4">
            <RiskChartWidget />
          </div>
        </div>
      </div>

      {/* Right Sidebar Column */}
      <div className="w-[320px] flex flex-col gap-4 overflow-y-auto scrollbar-hide pb-10">
        {/* Ativos Cadastrados */}
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-5">Ativos Cadastrados</h2>
          <div className="space-y-6">
            {grupos.map((grupo: any) => (
              <div key={grupo.id}>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{grupo.nome}</h3>
                <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-2">
                  <div className="flex flex-col">
                    {grupo.ativos.map((ativo: any, index: number) => (
                      <div key={ativo.id} className={`flex justify-between items-center py-1 px-2 hover:bg-[#1e293b]/30 rounded-md transition-colors`}>
                        <AssetQuote codigo={ativo.codigo} fonte={ativo.fonte} nome={ativo.nome} layout="row" />
                      </div>
                    ))}
                  </div>
                  {grupo.ativos.length === 0 && (
                    <div className="py-2 px-2 text-xs text-slate-500 italic">Nenhum ativo neste grupo</div>
                  )}
                </div>
              </div>
            ))}
            {grupos.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">Nenhum ativo cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
