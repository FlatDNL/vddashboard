'use client'

import { useState, useEffect } from 'react'
import { Scale, ArrowDown, ArrowUp } from 'lucide-react'

type FairValueData = {
  current: number
  fair: number
  distortionPct: number
  status: 'CARO' | 'BARATO' | 'NEUTRO'
  metrics: {
    dxyPct: number
    emPct: number
  }
}

export function FairValueWidget() {
  const [data, setData] = useState<FairValueData | null>(null)
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
    const interval = setInterval(fetchData, 10000) // Atualiza a cada 10s
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  if (loading || !data) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex items-center justify-center h-[160px] animate-pulse">
        <span className="text-slate-500 text-sm">Calculando arbitragem...</span>
      </div>
    )
  }

  const isCaro = data.status === 'CARO'
  const isBarato = data.status === 'BARATO'

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col justify-between h-auto relative overflow-hidden">
      
      {/* Background glow based on status */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${
        isCaro ? 'bg-red-500' : isBarato ? 'bg-green-500' : 'bg-slate-500'
      }`} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">Termômetro de Distorção (WDO)</h2>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded font-bold border ${
          isCaro ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
          isBarato ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
          'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}>
          {data.status === 'CARO' ? 'DÓLAR CARO (Venda)' : data.status === 'BARATO' ? 'DÓLAR BARATO (Compra)' : 'NEUTRO'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div>
          <p className="text-[11px] text-slate-500 mb-1">Preço Atual</p>
          <p className="text-xl font-bold text-white">
            R$ {data.current.toFixed(4)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 mb-1">Justíssimo (Macro)</p>
          <p className="text-xl font-bold text-blue-400">
            R$ {data.fair.toFixed(4)}
          </p>
        </div>
      </div>

      <div className="mt-5 relative z-10">
        <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
          <span>Distorção do Preço Justo</span>
          <span className={`font-bold flex items-center gap-1 ${
            data.distortionPct > 0 ? 'text-red-400' : data.distortionPct < 0 ? 'text-green-400' : 'text-slate-400'
          }`}>
            {data.distortionPct > 0 ? <ArrowUp size={12}/> : data.distortionPct < 0 ? <ArrowDown size={12}/> : null}
            {Math.abs(data.distortionPct).toFixed(2)}%
          </span>
        </div>
        
        {/* Barra de distorção */}
        <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden flex relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-400 z-10" />
          
          {/* Lado esquerdo (Barato / Verde) */}
          <div className="w-1/2 h-full flex justify-end">
            {data.distortionPct < 0 && (
              <div 
                className="h-full bg-green-500 rounded-l-full" 
                style={{ width: `${Math.min(Math.abs(data.distortionPct) * 100, 100)}%` }} 
              />
            )}
          </div>
          
          {/* Lado direito (Caro / Vermelho) */}
          <div className="w-1/2 h-full flex justify-start">
            {data.distortionPct > 0 && (
              <div 
                className="h-full bg-red-500 rounded-r-full" 
                style={{ width: `${Math.min(Math.abs(data.distortionPct) * 100, 100)}%` }} 
              />
            )}
          </div>
        </div>
        
        <div className="flex justify-between mt-3 text-[10px] text-slate-500">
          <span>DXY: {data.metrics.dxyPct > 0 ? '+' : ''}{data.metrics.dxyPct.toFixed(2)}%</span>
          <span>Emergentes: {data.metrics.emPct > 0 ? '+' : ''}{data.metrics.emPct.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  )
}
