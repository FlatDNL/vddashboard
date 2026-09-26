import { MacroOverviewWidget } from '@/components/MacroOverviewWidget'

export default function MacroeconomiaVisaoGeralPage() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between bg-[#0f172a] p-6 rounded-2xl border border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Visão Geral Macroeconômica</h1>
          <p className="text-sm text-slate-400">
            Central de Notícias, Indicadores Globais e Estudo Direcional de Pressão no Dólar Futuro (WDO).
          </p>
        </div>
      </div>
      
      <MacroOverviewWidget />
    </div>
  )
}
