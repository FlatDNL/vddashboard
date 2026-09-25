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

export function RiskChartWidget() {
  const [history, setHistory] = useState<DataPoint[]>([])

  useEffect(() => {
    let isMounted = true

    
    async function loadHistory() {
      try {
        const res = await fetch('/api/risk/history')
        if (res.ok && isMounted) {
          const data = await res.json()
          setHistory(data)
        }
      } catch (e) {
        console.error('Erro ao carregar histórico', e)
      }
    }

    async function fetchRisk() {
      try {
        const res = await fetch('/api/risk')
        if (res.ok && isMounted) {
          const data = await res.json()
          
          const now = new Date()
          const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

          setHistory(prev => {
            // Evita duplicar o mesmo minuto se as requisições acontecerem rápido
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
            if (updated.length > 60) {
              return updated.slice(updated.length - 60)
            }
            return updated
          })
        }
      } catch (e) {
        console.error(e)
      }
    }

    // Busca o histórico primeiro
    loadHistory().then(() => {
      // E então busca o risco atual para garantir que temos o ponto mais recente
      fetchRisk()
    })

    
    // Atualiza a cada 1 minuto (60000 ms)
    const interval = setInterval(fetchRisk, 60000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex flex-col gap-5 w-full h-[350px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-slate-200">Evolução do Risco (Intraday)</h2>
        </div>
        <div className="text-[10px] text-slate-500 bg-[#0b1120] px-2 py-1 rounded border border-[#1e293b]">
          Atualiza a cada 1 min
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
          <div className="h-full flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Coletando dados para o gráfico...
          </div>
        )}
      </div>
    </div>
  )
}
