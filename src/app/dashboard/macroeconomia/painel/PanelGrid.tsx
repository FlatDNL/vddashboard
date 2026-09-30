'use client'

import { useState, useEffect } from 'react'

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function PanelAssetRow({ ativo }: { ativo: any }) {
  const [quote, setQuote] = useState<{ price?: number; changePercent?: number; time?: string; error?: string } | null>(null)
  
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quote?symbol=${encodeURIComponent(ativo.codigo)}&source=${ativo.fonte}`)
        const data = await res.json()
        
        if (isMounted) {
          if (res.ok) {
            setQuote({ 
              price: data.price, 
              changePercent: data.changePercent,
              time: formatTime(new Date())
            })
          } else {
            setQuote(prev => prev ? { ...prev, error: data.error } : { error: data.error })
          }
        }
      } catch (err) {
        if (isMounted) setQuote(prev => prev ? { ...prev, error: 'Falha' } : { error: 'Falha' })
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(fetchQuote, 5000)
        }
      }
    }

    fetchQuote()
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [ativo.codigo, ativo.fonte])

  const isPositive = (quote?.changePercent ?? 0) >= 0
  const colorClass = isPositive ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-[#1e293b]/50 border-b border-[#1e293b]/50 last:border-0 transition-colors group cursor-default">
      <div className="flex items-center gap-2 w-1/3">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors"></span>
        <span className="text-xs font-medium text-slate-300 truncate" title={ativo.nome}>{ativo.nome}</span>
      </div>
      
      <div className="flex items-center justify-end gap-2 w-2/3">
        <span className="text-xs font-bold text-slate-100 w-20 text-right">
          {quote?.price !== undefined ? quote.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
        </span>
        <span className={`text-xs font-bold w-16 text-right ${quote?.changePercent !== undefined ? colorClass : 'text-slate-500'}`}>
          {quote?.changePercent !== undefined ? `${isPositive ? '+' : ''}${quote.changePercent.toFixed(2)}%` : '---'}
        </span>
        <span className="text-[10px] font-mono text-slate-500 w-16 text-right">
          {quote?.time || '--:--:--'}
        </span>
      </div>
    </div>
  )
}

export function PanelGrid({ grupos }: { grupos: any[] }) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
        {grupos.map((grupo) => (
          <div key={grupo.id} className="bg-[#0b1120] border border-[#1e293b] rounded-lg overflow-hidden flex flex-col shadow-lg">
            <div className="bg-[#0f172a] border-b border-[#1e293b] px-3 py-2 flex items-center justify-between">
              <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest">{grupo.nome}</h2>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-2 py-1.5 bg-[#131d33] border-b border-[#1e293b]">
                <span className="text-[10px] font-bold text-slate-400 w-1/3 pl-3.5">Nome</span>
                <div className="flex items-center justify-end gap-2 w-2/3">
                  <span className="text-[10px] font-bold text-slate-400 w-20 text-right">Último</span>
                  <span className="text-[10px] font-bold text-slate-400 w-16 text-right">Var.%</span>
                  <span className="text-[10px] font-bold text-slate-400 w-16 text-right">Hora</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                {grupo.ativos.length > 0 ? (
                  grupo.ativos.map((ativo: any) => (
                    <PanelAssetRow key={ativo.id} ativo={ativo} />
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500 italic">Nenhum ativo cadastrado</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {grupos.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            Nenhum grupo de ativos cadastrado.
          </div>
        )}
      </div>
    </div>
  )
}
