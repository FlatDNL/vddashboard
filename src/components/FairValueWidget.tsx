'use client'

import { useState, useEffect } from 'react'
import { Calculator } from 'lucide-react'

type PlanilhaData = {
  atual: number
  justo: number
  justissimo: number
  maxima: number
  minima: number
  status: 'COMPRA' | 'VENDA' | 'NEUTRO'
  metrics: {
    dxyPct: number
    emPct: number
  }
}

export function FairValueWidget() {
  const [data, setData] = useState<PlanilhaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        const res = await fetch('/api/fair-value')
        if (res.ok && isMounted) {
          const json = await res.json()
          setData(json)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000) 
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  if (loading || !data) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex items-center justify-center h-[200px] animate-pulse">
        <span className="text-slate-500 text-sm">Carregando Planilha Quant...</span>
      </div>
    )
  }

  const formatPts = (val: number) => {
    return (Math.round(val * 2) / 2).toFixed(1).replace('.', ',')
  }

  const isCompra = data.status === 'COMPRA'
  const isVenda = data.status === 'VENDA'

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col justify-between h-auto relative overflow-hidden min-w-[300px]">
      
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 ${
        isCompra ? 'bg-green-500' : isVenda ? 'bg-red-500' : 'bg-slate-500'
      }`} />

      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">Planilha Dólar (WDO)</h2>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded font-bold border ${
          isCompra ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
          isVenda ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
          'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}>
          VIÉS MACRO: {data.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-2 relative z-10 mb-4">
        {/* Coluna 1 - Linha 1: JUSTO */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-medium mb-1">JUSTO (Base)</span>
          <span className="text-lg font-bold text-slate-300">{formatPts(data.justo)}</span>
        </div>

        {/* Coluna 2 - Linha 1: MÁXIMA */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[10px] text-red-400 font-medium mb-1">MÁXIMA (Resistência)</span>
          <span className="text-lg font-bold text-slate-200">{formatPts(data.maxima)}</span>
        </div>

        {/* Coluna 1 - Linha 2: JUSTÍSSIMO */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[10px] text-blue-400 font-medium mb-1">JUSTÍSSIMO</span>
          <span className="text-lg font-bold text-white">{formatPts(data.justissimo)}</span>
        </div>

        {/* Coluna 2 - Linha 2: MÍNIMA */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[10px] text-green-400 font-medium mb-1">MÍNIMA (Suporte)</span>
          <span className="text-lg font-bold text-slate-200">{formatPts(data.minima)}</span>
        </div>
      </div>

      <div className="relative z-10 border-t border-[#1e293b] pt-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Preço Spot Estimado</span>
          <span className="font-mono text-slate-200">{formatPts(data.atual)} pts</span>
        </div>
      </div>
    </div>
  )
}
