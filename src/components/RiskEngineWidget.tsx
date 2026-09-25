'use client'

import { useState, useEffect } from 'react'
import { Globe, MapPin } from 'lucide-react'

type RiskData = {
  global: { score: number; status: string }
  brazil: { score: number; status: string }
  wdo: { score: number; action: string }
  timestamp: string
}

export function RiskEngineWidget() {
  const [data, setData] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function fetchRisk() {
      try {
        setLoading(true)
        const res = await fetch('/api/risk')
        if (res.ok && isMounted) {
          setData(await res.json())
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchRisk()
    const interval = setInterval(fetchRisk, 60000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const getStatusColor = (status: string) => {
    if (status === 'Risk ON') return 'text-emerald-500'
    if (status === 'Risk OFF') return 'text-red-500'
    return 'text-yellow-500'
  }

  const getScoreColor = (score: number) => {
    if (score >= 30) return 'text-emerald-400'
    if (score <= -30) return 'text-red-400'
    return 'text-yellow-400'
  }

  if (loading && !data) {
    return (
      <div className="flex gap-4">
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 w-56 flex justify-center text-xs text-slate-500 animate-pulse">Carregando...</div>
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 w-56 flex justify-center text-xs text-slate-500 animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex gap-4">
      {/* Global Risk Card */}
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex flex-col items-center justify-center w-56 gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Globe size={20} />
          <span className="text-xs font-semibold uppercase tracking-wider">Risk Global</span>
        </div>
        <div className={`text-xl font-bold uppercase ${getStatusColor(data.global.status)}`}>
          {data.global.status}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">SCORE:</span>
          <span className={`text-sm font-mono font-bold ${getScoreColor(data.global.score)}`}>
            {data.global.score > 0 ? '+' : ''}{data.global.score}
          </span>
        </div>
      </div>

      {/* Brazil Risk Card */}
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex flex-col items-center justify-center w-56 gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <MapPin size={20} />
          <span className="text-xs font-semibold uppercase tracking-wider">Risk Brasil</span>
        </div>
        <div className={`text-xl font-bold uppercase ${getStatusColor(data.brazil.status)}`}>
          {data.brazil.status}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">SCORE:</span>
          <span className={`text-sm font-mono font-bold ${getScoreColor(data.brazil.score)}`}>
            {data.brazil.score > 0 ? '+' : ''}{data.brazil.score}
          </span>
        </div>
      
      </div>
      {/* WDO Pressure Card */}
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex flex-col items-center justify-center w-56 gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Pressão Direcional</span>
        </div>
        <div className={`text-xl font-bold uppercase text-center leading-tight ${
          data.wdo.action.includes('Compra') ? 'text-emerald-500' : 
          data.wdo.action.includes('Venda') ? 'text-red-500' : 'text-yellow-500'
        }`}>
          {data.wdo.action}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">SCORE DÓLAR (WDO):</span>
          <span className={`text-sm font-mono font-bold ${
            data.wdo.score >= 30 ? 'text-emerald-400' : 
            data.wdo.score <= -30 ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {data.wdo.score > 0 ? '+' : ''}{data.wdo.score}
          </span>
        </div>
      </div>
    </div>
  )
}
