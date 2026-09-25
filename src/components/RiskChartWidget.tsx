'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'

type DataPoint = {
  time: string
  Global: number
  Brasil: number
  WDO: number
}

const TIMEFRAMES = [
  { id: '1m', label: '1m' },
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '30m', label: '30m' },
  { id: '1h', label: '1h' },
  { id: '4h', label: '4h' },
  { id: '1d', label: 'Diário' },
]

export function RiskChartWidget() {
  const [history, setHistory] = useState<DataPoint[]>([])
  const [timeframe, setTimeframe] = useState('1m')

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

    async function fetchRisk() {
      // Quando em 1m, podemos adicionar pontos dinamicamente para o gráfico andar
      if (timeframe !== '1m') return

      try {
        const res = await fetch('/api/risk')
        if (res.ok && isMounted) {
          const data = await res.json()
          
          const now = new Date()
          const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

          setHistory(prev => {
            if (prev.length > 0 && prev[prev.length - 1].time === timeString) {
              return prev
            }
            
            const newPoint = {
              time: timeString,
              Global: data.global.score,
              Brasil: data.brazil.score,
              WDO: data.wdo.score
            }
            
            const updated = [...prev, newPoint]
            if (updated.length > 120) {
              return updated.slice(updated.length - 120)
            }
            return updated
          })
        }
      } catch (e) {
        console.error(e)
      }
    }

    // Busca o histórico inicial
    loadHistory().then(() => {
      // Se for 1m, busca o ponto mais recente agora e continua a cada 1 minuto
      if (timeframe === '1m') {
        fetchRisk()
      }
    })
    
    let interval: NodeJS.Timeout | null = null
    
    // Configura os intervalos de atualização baseados no timeframe
    if (timeframe === '1m') {
      interval = setInterval(fetchRisk, 60000)
    } else {
      // Para tempos maiores, recarrega o histórico completo a cada minuto
      interval = setInterval(loadHistory, 60000)
    }
    
    return () => {
      isMounted = false
      if (interval) clearInterval(interval)
    }
  }, [timeframe])

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex flex-col gap-5 w-full h-[400px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-slate-200">Evolução do Risco</h2>
        </div>
        
        {/* Timeframe Buttons */}
        <div className="flex bg-[#0b1120] rounded-lg border border-[#1e293b] p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${
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

      <div className="flex-1 w-full min-h-0">
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={[-100, 100]}
                ticks={[-100, -50, 0, 50, 100]}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b1120', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
              
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
          <div className="h-full flex flex-col gap-2 items-center justify-center text-xs text-slate-500">
            <div className="animate-pulse">Calculando amostragem histórica...</div>
            {timeframe !== '1m' && <div className="text-[10px] text-slate-600">(Lembre-se: O banco de dados acabou de ser criado. Intervalos longos ainda estão vazios!)</div>}
          </div>
        )}
      </div>
    </div>
  )
}
