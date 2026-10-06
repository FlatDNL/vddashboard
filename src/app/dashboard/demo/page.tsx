import React from 'react';
import { ArrowUp, ArrowDown, Eye, EyeOff, Globe, Calendar, Activity, TrendingUp, TrendingDown } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-full bg-[#020617] p-4 text-slate-200 overflow-y-auto scrollbar-hide">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WDOFUT</h1>
          <p className="text-sm text-slate-400">Mini Dólar Futuro • Vencimento SET/25</p>
        </div>
        <div className="flex items-center gap-4 bg-[#0f172a] border border-[#1e293b] rounded-xl p-3">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">5.672,50</span>
            <span className="text-xs text-emerald-500 font-medium flex items-center">
              <ArrowUp size={12} className="mr-1" /> +0,86% (+48,50)
            </span>
          </div>
          <div className="h-10 w-px bg-[#1e293b]"></div>
          <div className="flex flex-col text-xs text-slate-400 gap-1">
            <div className="flex justify-between gap-4"><span>MÁX.</span> <span className="text-slate-200">5.681,00</span></div>
            <div className="flex justify-between gap-4"><span>MÍN.</span> <span className="text-slate-200">5.630,00</span></div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6 pb-10">
        
        {/* COLUNA 1: Preço Justo & Saldo de Agressão */}
        <div className="flex flex-col gap-4 xl:gap-6">
          
          {/* Preços de Referência */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 md:p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Preços de Referência (R$)</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1 font-medium">JUSTO</div>
                  <div className="text-lg font-bold text-slate-200">5.667,80</div>
                </div>
                <div className="text-emerald-500 font-medium text-sm">+4,70</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1 font-medium">JUSTÍSSIMO</div>
                  <div className="text-lg font-bold text-slate-200">5.664,20</div>
                </div>
                <div className="text-emerald-500 font-medium text-sm">+8,30</div>
              </div>

              <div className="h-px w-full bg-[#1e293b] my-2"></div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1 font-medium">MÁXIMA DO DÓLAR</div>
                  <div className="text-sm font-semibold text-slate-300">5.683,50</div>
                </div>
                <div className="text-red-500 text-xs font-medium">-11,00 pts</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1 font-medium">MÍNIMA DO DÓLAR</div>
                  <div className="text-sm font-semibold text-slate-300">5.640,10</div>
                </div>
                <div className="text-emerald-500 text-xs font-medium">+32,40 pts</div>
              </div>
            </div>
          </div>

          {/* Saldo de Agressão (Gauge e Composição) */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 md:p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Pressão & Agressão</h2>
            
            <div className="flex items-center justify-center mb-6 mt-2 relative">
               <svg viewBox="0 0 100 55" className="w-48 overflow-visible">
                  {/* Background Arc */}
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
                  {/* Foreground Arc - Positive (Green) */}
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round" strokeDasharray="125" strokeDashoffset="40" />
               </svg>
               <div className="absolute bottom-2 flex flex-col items-center">
                 <span className="text-3xl font-bold text-emerald-500">+76</span>
                 <span className="text-[10px] font-semibold text-emerald-500 tracking-wider">COMPRADOR</span>
               </div>
            </div>

            <div className="space-y-3">
               {[
                 { label: 'Agressão', val: '+72', color: 'bg-emerald-500', width: '80%' },
                 { label: 'Impulso', val: '+86', color: 'bg-emerald-400', width: '90%' },
                 { label: 'Velocidade', val: '+76', color: 'bg-emerald-600', width: '75%' },
                 { label: 'Book', val: '+68', color: 'bg-emerald-500', width: '70%' },
                 { label: 'Absorção', val: '-18', color: 'bg-red-500', width: '20%' },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between gap-2 text-xs">
                   <span className="text-slate-400 w-20">{item.label}</span>
                   <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                     <div className={`h-full ${item.color} rounded-full`} style={{width: item.width}}></div>
                   </div>
                   <span className={`w-8 text-right font-semibold ${item.val.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>{item.val}</span>
                 </div>
               ))}
            </div>
          </div>
          
        </div>

        {/* COLUNA 2: Risco & Calendário */}
        <div className="flex flex-col gap-4 xl:gap-6">
          
          {/* Risk */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex flex-col items-center text-center">
              <Globe className="text-slate-500 mb-2" size={24} />
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Global Risk</div>
              <div className="text-2xl font-bold text-slate-200 mb-1">50,2</div>
              <div className="text-[10px] font-medium text-slate-500 bg-[#1e293b] px-2 py-0.5 rounded-full">Neutro</div>
            </div>
            
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex flex-col items-center text-center">
              <div className="h-6 w-6 rounded-full bg-green-700 border border-yellow-400 flex items-center justify-center mb-2">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Risk Brasil</div>
              <div className="text-2xl font-bold text-slate-200 mb-1">48,7</div>
              <div className="text-[10px] font-medium text-slate-500 bg-[#1e293b] px-2 py-0.5 rounded-full">Neutro</div>
            </div>
          </div>

          {/* Calendário Econômico */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 md:p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-slate-400" size={16} />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calendário Econômico</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { time: '09:30', country: '🇺🇸', event: 'Pedidos Iniciais por Seguro-Desemprego', impact: 3, actual: '228K', prev: '230K', status: 'positive' },
                { time: '09:30', country: '🇺🇸', event: 'Índice de Preços ao Produtor (PPI)', impact: 3, actual: '0.2%', prev: '0.1%', status: 'negative' },
                { time: '10:00', country: '🇧🇷', event: 'Produção Industrial (Mensal)', impact: 2, actual: '-0.1%', prev: '0.3%', status: 'negative' },
                { time: '14:00', country: '🇺🇸', event: 'Discurso de Powell (Fed)', impact: 3, actual: '-', prev: '-', status: 'neutral' },
                { time: '15:30', country: '🇺🇸', event: 'Balanço Orçamentário', impact: 2, actual: '-', prev: '-', status: 'neutral' },
              ].map((ev, i) => (
                <div key={i} className="flex gap-3 border-b border-[#1e293b] pb-3 last:border-0 last:pb-0">
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-xs font-mono text-slate-400">{ev.time}</span>
                    <span className="text-lg">{ev.country}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-300 mb-1">{ev.event}</div>
                    <div className="flex gap-1 mb-1">
                      {Array.from({length: 3}).map((_, j) => (
                        <Activity key={j} size={10} className={j < ev.impact ? 'text-red-500' : 'text-slate-600'} />
                      ))}
                    </div>
                    {ev.actual !== '-' && (
                       <div className="text-[10px] flex gap-3 text-slate-500 mt-1">
                         <span>Atual: <span className={ev.status === 'positive' ? 'text-emerald-500' : ev.status === 'negative' ? 'text-red-500' : ''}>{ev.actual}</span></span>
                         <span>Prev: {ev.prev}</span>
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* COLUNA 3: Ativos e Indicadores */}
        <div className="flex flex-col gap-4 xl:gap-6">
          
          {/* Ativos Cadastrados (Olhinho) */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 md:p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Ativos Monitorados</h2>
            
            <div className="space-y-2">
              {[
                { symbol: 'WDOFUT', name: 'Mini Dólar Futuro', price: '5.672,50', change: '+0,86%', color: 'text-emerald-500', visible: true },
                { symbol: 'WIN', name: 'Mini Índice Futuro', price: '134.500', change: '-1,20%', color: 'text-red-500', visible: true },
                { symbol: 'DI1F25', name: 'Juros Jan/25', price: '13,75%', change: '+0,12', color: 'text-emerald-500', visible: true },
                { symbol: 'DXY', name: 'Dollar Index', price: '100,48', change: '-0,32%', color: 'text-red-500', visible: true },
                { symbol: 'PETR4', name: 'Petrobras PN', price: '38,42', change: '+1,15%', color: 'text-emerald-500', visible: false },
                { symbol: 'VALE3', name: 'Vale ON', price: '62,30', change: '-0,50%', color: 'text-red-500', visible: false },
              ].map((asset, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${asset.visible ? 'bg-[#1e293b]/50' : 'opacity-50 hover:opacity-100'}`}>
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white transition-colors">
                      {asset.visible ? <Eye size={16} /> : <EyeOff size={16} className="text-slate-600" />}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{asset.symbol}</div>
                      <div className="text-[10px] text-slate-500">{asset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-300">{asset.price}</div>
                    <div className={`text-[10px] font-medium ${asset.color}`}>{asset.change}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-2 border border-[#1e293b] rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors">
              + Adicionar Ativo
            </button>
          </div>

          {/* Matriz de Fatores / Drivers */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 md:p-5 flex-1">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Drivers do Dólar</h2>
            
            <div className="space-y-3">
              {[
                { name: 'DI (jan/30)', val: '13,75%', change: '+0,12', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { name: '6L1! (BRL)', val: '5,462', change: '+0,18', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { name: 'DXY (USD)', val: '100,48', change: '-0,32', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
                { name: 'US 10Y', val: '4,18%', change: '+0,05', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { name: 'Petróleo (WTI)', val: '70,32', change: '+0,68', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              ].map((driver, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-[#1e293b]/30 rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className={`p-1.5 rounded-md ${driver.bg} ${driver.color}`}>
                       <driver.icon size={14} />
                     </div>
                     <span className="text-xs font-medium text-slate-300">{driver.name}</span>
                   </div>
                   <div className="text-right flex items-center gap-3">
                     <span className="text-xs font-mono text-slate-300">{driver.val}</span>
                     <span className={`text-[10px] w-8 text-right font-medium ${driver.color}`}>
                       {driver.change.startsWith('+') ? '▲' : '▼'} {driver.change.replace(/[+-]/, '')}
                     </span>
                   </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#1e293b]">
              <div className="flex items-center justify-between text-xs">
                 <span className="text-slate-400">Confluência Geral</span>
                 <span className="text-emerald-500 font-bold px-2 py-1 bg-emerald-500/10 rounded">FAVORÁVEL AO DÓLAR</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
