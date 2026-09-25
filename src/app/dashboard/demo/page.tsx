import { LineChart, BarChart2, Activity, Settings2, SlidersHorizontal, ArrowUp, ArrowDown, ShieldAlert, Target } from 'lucide-react'

export default function DashboardPage() {

  return (
    <div className="flex gap-6 h-full">
      {/* Main Column */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-hide pb-10">
        
        {/* Top Asset Header */}
        <div className="flex items-center justify-between bg-[#0f172a] p-4 rounded-2xl border border-[#1e293b]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
              <span className="text-2xl">🇺🇸</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                USD/BRL
              </h1>
              <span className="text-xs text-slate-400">Dólar Americano / Real Brasileiro</span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">5,4128</span>
                <span className="text-xs font-medium text-emerald-500 flex items-center">
                  <ArrowUp size={12} className="mr-0.5" /> +0,0324 (+0,60%)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                17:42:36
              </span>
            </div>
            
            <div className="hidden md:flex gap-6 text-[11px]">
              <div className="flex flex-col">
                <span className="text-slate-500 mb-0.5">Máxima do dia</span>
                <span className="font-semibold text-slate-200">5,4210</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 mb-0.5">Mínima do dia</span>
                <span className="font-semibold text-slate-200">5,3786</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 mb-0.5">Abertura</span>
                <span className="font-semibold text-slate-200">5,3804</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 mb-0.5">Fechamento anterior</span>
                <span className="font-semibold text-slate-200">5,3804</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-[#1e293b] p-1">
              {['M1', 'M5', 'M15', 'H1', 'H4', 'D1'].map((tf) => (
                <button
                  key={tf}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    tf === 'M15' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button className="p-2 rounded-lg bg-[#1e293b] text-slate-400 hover:text-white transition-colors">
              <Settings2 size={16} />
            </button>
          </div>
        </div>

        {/* 4 Indicator Cards Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Activity size={14} />
              </div>
              <span className="text-xs font-medium text-slate-300">Tendência Quântica</span>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <div className="text-xl font-bold text-emerald-500 mb-2 tracking-wide">ALTA</div>
              {/* Fake mini chart */}
              <div className="h-6 w-full flex items-end gap-1 mb-2">
                 <svg viewBox="0 0 100 20" className="w-full h-full stroke-emerald-500 fill-none" preserveAspectRatio="none">
                    <polyline points="0,15 10,12 20,18 30,5 40,10 50,2 60,8 70,2 80,10 90,4 100,0" strokeWidth="2" />
                 </svg>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-auto border-t border-[#1e293b] pt-2">
                <span>Probabilidade de continuidade</span>
                <span className="text-emerald-500 font-bold">72%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-4 flex flex-col items-center">
            <div className="flex w-full items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Activity size={14} />
              </div>
              <span className="text-xs font-medium text-slate-300">Força do Movimento</span>
            </div>
            {/* Fake Gauge */}
            <div className="relative w-24 h-24 mt-2">
               <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" className="stroke-[#1e293b] fill-none" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" className="stroke-emerald-500 fill-none" strokeWidth="12" strokeDasharray="251" strokeDashoffset="80" strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">68%</span>
                  <span className="text-[10px] text-emerald-500 font-medium">Forte</span>
               </div>
            </div>
          </div>
          
          <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-4 flex flex-col items-center">
            <div className="flex w-full items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Activity size={14} />
              </div>
              <span className="text-xs font-medium text-slate-300">Volatilidade Atual</span>
            </div>
            <div className="relative w-24 h-24 mt-2">
               <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" className="stroke-[#1e293b] fill-none" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" className="stroke-blue-500 fill-none" strokeWidth="12" strokeDasharray="251" strokeDashoffset="145" strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">42%</span>
                  <span className="text-[10px] text-blue-400 font-medium">Moderada</span>
               </div>
            </div>
          </div>
          
          <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-4 flex flex-col items-center">
            <div className="flex w-full items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <ArrowDown size={14} className="transform rotate-180" />
              </div>
              <span className="text-xs font-medium text-slate-300">Sentimento do Mercado</span>
            </div>
            <div className="relative w-24 h-24 mt-2">
               <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" className="stroke-[#1e293b] fill-none" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" className="stroke-emerald-500 fill-none" strokeWidth="12" strokeDasharray="251" strokeDashoffset="97" strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">61%</span>
                  <span className="text-[10px] text-emerald-500 font-medium">Otimista</span>
               </div>
            </div>
          </div>
        </div>

        {/* Middle Row (Chart + Support/Resistance) */}
        <div className="flex gap-4 h-[420px]">
          <div className="flex-1 bg-[#0f172a] rounded-2xl border border-[#1e293b] p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-slate-200">Dólar/Real - Gráfico de Preços</h2>
              <div className="flex gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 hover:text-white cursor-pointer"><BarChart2 size={14}/> Indicadores</span>
                <span className="flex items-center gap-1 hover:text-white cursor-pointer"><Settings2 size={14}/></span>
              </div>
            </div>
            <div className="flex-1 border border-[#1e293b] bg-[#0b1120] rounded-xl flex items-center justify-center relative overflow-hidden">
               {/* TradingView Placeholder */}
               <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-transparent"></div>
               <img src="https://s3.tradingview.com/tv-logo-bg.svg" className="absolute bottom-4 left-4 h-6 opacity-30" />
               <div className="flex flex-col items-center text-slate-500">
                 <LineChart size={48} className="mb-2 opacity-50" />
                 <span className="text-sm font-medium">Área do Gráfico TradingView</span>
                 <span className="text-xs mt-1 opacity-70">Aguardando integração na Fase 2</span>
               </div>
            </div>
          </div>
          
          <div className="w-64 bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-200 mb-6">Níveis de Suporte e Resistência</h2>
            <div className="flex-1 flex flex-col justify-between">
              {[
                { label: 'R3', value: '5,4500', color: 'text-emerald-500', bar: 'bg-emerald-500/20' },
                { label: 'R2', value: '5,4330', color: 'text-emerald-500', bar: 'bg-emerald-500/40' },
                { label: 'R1', value: '5,4200', color: 'text-emerald-500', bar: 'bg-emerald-500/60' },
                { label: 'Atual', value: '5,4128', color: 'text-blue-500', bar: 'bg-blue-500', active: true },
                { label: 'S1', value: '5,3980', color: 'text-red-500', bar: 'bg-red-500/60' },
                { label: 'S2', value: '5,3850', color: 'text-red-500', bar: 'bg-red-500/40' },
                { label: 'S3', value: '5,3700', color: 'text-red-500', bar: 'bg-red-500/20' },
              ].map((level, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-8 text-xs font-semibold ${level.color}`}>{level.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                    <div className={`h-full ${level.bar} ${level.active ? 'w-full' : 'w-2/3'}`}></div>
                  </div>
                  <span className={`w-14 text-right text-xs font-mono ${level.active ? 'text-white font-bold' : 'text-slate-400'}`}>{level.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row (Volume, Osciladores, Mapa Calor) */}
        <div className="grid grid-cols-3 gap-4 h-64">
          <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Análise de Volume</h2>
            <div className="flex-1 flex items-end gap-1 px-2 pb-2">
              {Array.from({length: 30}).map((_, i) => (
                <div key={i} className={`flex-1 rounded-t-sm ${Math.random() > 0.5 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{height: `${Math.random() * 100}%`}}></div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">Osciladores Quânticos</h2>
            <div className="flex-1 flex items-center justify-between">
              <div className="relative w-28 h-28">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" className="stroke-[#1e293b] fill-none" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" className="stroke-cyan-400 fill-none" strokeWidth="10" strokeDasharray="251" strokeDashoffset="70" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">72%</span>
                    <span className="text-[9px] text-cyan-400 font-medium">Mercado em Alta</span>
                 </div>
              </div>
              <div className="flex-1 flex flex-col gap-3 pl-4">
                {[
                  { name: 'Momentum', val: '68%', color: 'bg-emerald-500', textCol: 'text-emerald-500' },
                  { name: 'Força Relativa', val: '74%', color: 'bg-cyan-400', textCol: 'text-cyan-400' },
                  { name: 'Amplitude', val: '61%', color: 'bg-blue-500', textCol: 'text-blue-500' },
                  { name: 'Tendência', val: '80%', color: 'bg-emerald-400', textCol: 'text-emerald-400' },
                ].map((osc, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400 flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${osc.color}`}></span>{osc.name}</span>
                      <span className={`font-semibold ${osc.textCol}`}>{osc.val}</span>
                    </div>
                    <div className="h-1 w-full bg-[#1e293b] rounded-full overflow-hidden">
                      <div className={`h-full ${osc.color}`} style={{width: osc.val}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Mapa de Calor - Fluxo de Ordens</h2>
            <div className="flex-1 relative rounded-lg overflow-hidden flex flex-col">
               <div className="flex justify-between text-[9px] text-slate-500 mb-1 px-1">
                 <span>5,4400</span><span>5,4300</span><span>5,4200</span>
               </div>
               <div className="flex-1 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-emerald-500/20 border border-[#1e293b] rounded">
                 {/* Fake heatmap grid */}
                 <div className="w-full h-full grid grid-cols-10 grid-rows-5 gap-0.5 p-0.5 mix-blend-screen">
                    {Array.from({length: 50}).map((_, i) => (
                      <div key={i} className={`rounded-sm ${Math.random() > 0.7 ? 'bg-red-500/80' : Math.random() > 0.4 ? 'bg-yellow-500/80' : 'bg-emerald-500/80'}`} style={{opacity: Math.random() * 0.5 + 0.5}}></div>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Very Bottom Row: Análise Quantitativa - USD/BRL */}
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Análise Quantitativa - USD/BRL</h2>
          <div className="grid grid-cols-4 gap-4">
             <div className="bg-[#0b1120] rounded-xl p-3 border border-[#1e293b]">
               <div className="flex items-center gap-2 mb-2">
                 <div className="p-1 rounded bg-emerald-500/20 text-emerald-500"><ArrowUp size={12}/></div>
                 <span className="text-[10px] text-slate-400">Probabilidade de Alta</span>
               </div>
               <div className="text-xl font-bold text-white mb-2">72%</div>
               <div className="h-1 w-full bg-[#1e293b] rounded-full"><div className="h-full bg-emerald-500 w-[72%] rounded-full"></div></div>
             </div>
             
             <div className="bg-[#0b1120] rounded-xl p-3 border border-[#1e293b]">
               <div className="flex items-center gap-2 mb-2">
                 <div className="p-1 rounded bg-red-500/20 text-red-500"><ArrowDown size={12}/></div>
                 <span className="text-[10px] text-slate-400">Probabilidade de Baixa</span>
               </div>
               <div className="text-xl font-bold text-white mb-2">28%</div>
               <div className="h-1 w-full bg-[#1e293b] rounded-full"><div className="h-full bg-red-500 w-[28%] rounded-full"></div></div>
             </div>
             
             <div className="bg-[#0b1120] rounded-xl p-3 border border-[#1e293b] flex items-center gap-4">
               <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-500"><ShieldAlert size={20}/></div>
               <div>
                 <div className="text-[10px] text-slate-400">Risco Atual</div>
                 <div className="text-lg font-bold text-yellow-500">Médio</div>
                 <div className="w-16 h-1 mt-1 bg-[#1e293b] rounded-full"><div className="h-full bg-yellow-500 w-1/2 rounded-full"></div></div>
               </div>
             </div>
             
             <div className="bg-[#0b1120] rounded-xl p-3 border border-[#1e293b] flex items-center gap-4">
               <div className="p-2 rounded-xl bg-blue-500/20 text-blue-500"><Target size={20}/></div>
               <div>
                 <div className="text-[10px] text-slate-400">Recomendação</div>
                 <div className="text-sm font-bold text-blue-400">Aguardar Confirmação</div>
               </div>
             </div>
          </div>
        </div>

      </div>

      {/* Right Sidebar Column */}
      <div className="w-[320px] flex flex-col gap-4 overflow-y-auto scrollbar-hide pb-10">
        
        {/* Indicadores Técnicos */}
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-5">Indicadores Técnicos</h2>
          <div className="space-y-4">
            {[
              { name: 'RSI (14)', val: '68,4', status: 'Comprado', col: 'text-emerald-500', dot: 'bg-slate-500' },
              { name: 'MACD', val: '0,0123', status: 'Comprado', col: 'text-emerald-500', dot: 'bg-emerald-500' },
              { name: 'Estocástico (14,3,3)', val: '78,2', status: 'Comprado', col: 'text-emerald-500', dot: 'bg-emerald-500' },
              { name: 'Média Móvel (50)', val: '5,3901', status: 'Alta', col: 'text-emerald-500', dot: 'bg-yellow-500' },
              { name: 'Média Móvel (200)', val: '5,3647', status: 'Alta', col: 'text-emerald-500', dot: 'bg-yellow-500' },
            ].map((ind, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${ind.dot}`}></span> {ind.name}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-200 font-mono font-medium">{ind.val}</span>
                  <span className={`${ind.col} w-16 text-right font-medium`}>{ind.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sinais de Mercado */}
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-200 mb-5">Sinais de Mercado</h2>
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <ArrowUp size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Entrada de Compra</div>
                    <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> Confirmado
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-300 font-mono">5,4120</div>
             </div>
             
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                    <ArrowDown size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Entrada de Venda</div>
                    <div className="text-[10px] text-red-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span> Aguardando
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-300 font-mono">5,4200</div>
             </div>
             
             <div className="pt-3 border-t border-[#1e293b] space-y-3">
               <div className="flex justify-between text-xs">
                 <span className="text-slate-400 flex items-center gap-2"><ArrowUp size={12} className="text-cyan-500"/> Alvo 1</span>
                 <span className="text-slate-300 font-mono">5,4330</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-slate-400 flex items-center gap-2"><ArrowUp size={12} className="text-cyan-500"/> Alvo 2</span>
                 <span className="text-slate-300 font-mono">5,4500</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-slate-400 flex items-center gap-2"><ArrowDown size={12} className="text-red-500"/> Stop Loss</span>
                 <span className="text-slate-300 font-mono">5,3980</span>
               </div>
             </div>
          </div>
        </div>

        {/* Últimas Notícias */}
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex-1">
          <h2 className="text-sm font-semibold text-slate-200 mb-5">Últimas Notícias</h2>
          <div className="space-y-4">
             <div className="pb-4 border-b border-[#1e293b]/50">
               <p className="text-xs text-slate-300 leading-relaxed mb-1">
                 Dólar fecha em alta com exterior e dados do Brasil
               </p>
               <span className="text-[10px] text-slate-500">22/09/2025 17:21</span>
             </div>
             <div className="pb-4 border-b border-[#1e293b]/50">
               <p className="text-xs text-slate-300 leading-relaxed mb-1">
                 Mercado ajusta projeções para juros após ata do Copom
               </p>
               <span className="text-[10px] text-slate-500">22/09/2025 16:58</span>
             </div>
             <div className="pb-4 border-b border-[#1e293b]/50">
               <p className="text-xs text-slate-300 leading-relaxed mb-1">
                 Fluxo estrangeiro volta ao Brasil e fortalece o real
               </p>
               <span className="text-[10px] text-slate-500">22/09/2025 16:32</span>
             </div>
             
             <button className="text-xs text-blue-400 hover:text-blue-300 mt-2">
               Ver todas as notícias →
             </button>
          </div>
        </div>

      </div>
    </div>
  )
}
