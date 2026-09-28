'use client'

import { useState } from 'react'
import { AssetQuote } from '@/components/AssetQuote'
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react'

export function RightSidebar({ grupos }: { grupos: any[] }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div 
      className={`flex flex-col gap-4 overflow-y-auto scrollbar-hide pb-10 transition-all duration-300 h-full ${
        collapsed ? 'w-16' : 'w-[320px]'
      }`}
    >
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-3 flex flex-col h-full overflow-hidden">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} mb-5`}>
          {!collapsed && <h2 className="text-sm font-semibold text-slate-200 whitespace-nowrap pl-2">Ativos Cadastrados</h2>}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-400 hover:text-slate-200 flex-shrink-0"
            title={collapsed ? "Expandir Painel" : "Recolher Painel"}
          >
            {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {!collapsed ? (
            <div className="space-y-6 px-2">
              {grupos.map((grupo: any) => (
                <div key={grupo.id}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{grupo.nome}</h3>
                  <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-2">
                    <div className="flex flex-col">
                      {grupo.ativos.map((ativo: any) => (
                        <div key={ativo.id} className="flex justify-between items-center py-1 px-2 hover:bg-[#1e293b]/30 rounded-md transition-colors">
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
          ) : (
            <div className="flex flex-col items-center pt-4">
              <div 
                className="text-xs font-semibold text-slate-500 tracking-widest uppercase flex flex-col items-center gap-6"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                <Activity size={16} className="text-blue-500/50 mb-2 rotate-90" />
                Ativos Cadastrados
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
