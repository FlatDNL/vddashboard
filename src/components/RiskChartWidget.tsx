'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Globe, MapPin, Gauge } from 'lucide-react'

type DataPoint = {
  time: string
  Global: number
  Brasil: number
  WDO: number
}

type RiskData = {
  global: { score: number; status: string }
  brazil: { score: number; status: string }
  wdo: { score: number; action: string }
}

const TIMEFRAMES = [
  { id: '30m', label: '30m' },
  { id: '1h', label: '1h' },
  { id: '4h', label: '4h' },
  { id: '1d', label: 'Diário' },
]

export function RiskChartWidget() {
  const [history, setHistory] = useState<DataPoint[]>([])
  const [riskData, setRiskData] = useState<RiskData | null>(null)
  const [timeframe, setTimeframe] = useState('30m')

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      try {
        const res = await fetch(`/api/risk/history?tf=${timeframe}`)
        if (res.ok && isMounted) {
          const data = await res.json()
          setHistory(data)
        }
      } catch (e) {
        console.error('Erro ao carregar histórico', e)
      }
    }

    async function tickEngineAndLoad() {
      try {
        const res = await fetch('/api/risk')
        if (res.ok && isMounted) {
          const data = await res.json()
          setRiskData(data)
        }
      } catch (e) {
        // ignora
      }
      await loadHistory()
    }

    tickEngineAndLoad()
    const interval = setInterval(tickEngineAndLoad, 60000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [timeframe])

  const getStatusColor = (status: string) => {
    if (status === 'Risk ON') return 'text-emerald-400'
    if (status === 'Risk OFF') return 'text-red-400'
    return 'text-yellow-400'
  }

  const getScoreColor = (score: number) => {
    if (score >= 30) return 'text-emerald-400'
    if (score <= -30) return 'text-red-400'
    return 'text-yellow-400'
  }

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col gap-4 w-full h-[450px]">
      {/* 3 KPI Cards Integrados no topo do mesmo Card */}
      {riskData ? (
        <div className="grid grid-cols-3 gap-2">
          {/* Global Risk */}
          <div className="bg-[#0b1120] rounded-xl border border-[#1e293b] p-2.5 flex flex-col items-center justify-center gap-1 text-center">
            <div className="flex items-center gap-1 text-slate-400">
              <Globe size={13} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Risk Global</span>
            </div>
            <div className={`text-xs font-bold uppercase ${getStatusColor(riskData.global.status)}`}>
              {riskData.global.status}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              SCORE: <span className={`font-bold ${getScoreColor(riskData.global.score)}`}>{riskData.global.score > 0 ? '+' : ''}{riskData.global.score}</span>
            </div>
          </div>

          {/* Brazil Risk */}
          <div className="bg-[#0b1120] rounded-xl border border-[#1e293b] p-2.5 flex flex-col items-center justify-center gap-1 text-center">
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin size={13} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Risk Brasil</span>
            </div>
            <div className={`text-xs font-bold uppercase ${getStatusColor(riskData.brazil.status)}`}>
              {riskData.brazil.status}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              SCORE: <span className={`font-bold ${getScoreColor(riskData.brazil.score)}`}>{riskData.brazil.score > 0 ? '+' : ''}{riskData.brazil.score}</span>
            </div>
          </div>

          {/* WDO Pressure */}
          <div className="bg-[#0b1120] rounded-xl border border-[#1e293b] p-2.5 flex flex-col items-center justify-center gap-1 text-center">
            <div className="flex items-center gap-1 text-slate-400">
              <Gauge size={13} className="text-blue-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Pressão WDO</span>
            </div>
            <div className={`text-xs font-bold uppercase ${
              riskData.wdo.action.includes('Compra') ? 'text-emerald-400' : 
              riskData.wdo.action.includes('Venda') ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {riskData.wdo.action}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              SCORE: <span className={`font-bold ${getScoreColor(riskData.wdo.score)}`}>{riskData.wdo.score > 0 ? '+' : ''}{riskData.wdo.score}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-14 bg-[#0b1120] rounded-xl border border-[#1e293b] animate-pulse flex items-center justify-center text-xs text-slate-500">
          Carregando indicadores...
        </div>
      )}

      {/* Header do Gráfico + Seletor de Timeframe */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-purple-400" />
          <h2 className="text-xs font-semibold text-slate-200">Evolução do Risco</h2>
        </div>
        
        <div className="flex bg-[#0b1120] rounded-lg border border-[#1e293b] p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                timeframe === tf.id 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Área do Gráfico */}
      <div className="flex-1 w-full min-h-0">
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                domain={[-100, 100]}
                ticks={[-100, -50, 0, 50, 100]}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b1120', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} iconType="circle" />
              
              <Line 
                type="monotone" 
                dataKey="Global" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Brasil" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="WDO" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Carregando amostragem histórica...
          </div>
        )}
      </div>
    </div>
  )
}
