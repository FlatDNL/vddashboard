'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, RefreshCw, AlertTriangle } from 'lucide-react'

type PlayerGroup = {
  id: string
  name: string
  color: string
}

type AggressionRecord = {
  timestamp: string
  group_id: string
  cumulative_net_volume: number
  is_gap?: boolean
}

type ChartPoint = {
  timeOriginal: number
  time: string
  [key: string]: string | number
}

const TIMEFRAMES = [
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '30m', label: '30m' },
  { id: '4h', label: '4h' },
  { id: '1d', label: 'Diário' },
]

export function AggressionChartWidget() {
  const [asset, setAsset] = useState('WDOX26')
  const [timeframe, setTimeframe] = useState('5m')
  const [groups, setGroups] = useState<PlayerGroup[]>([])
  const [latestSaldos, setLatestSaldos] = useState<Record<string, number>>({})
  const [hasGap, setHasGap] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showResetModal, setShowResetModal] = useState(false)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [domainBounds, setDomainBounds] = useState<[number, number]>([0, 0])

  const loadData = async () => {
    try {
      const res = await fetch(`/api/aggression-balance?asset=${asset}&tf=${timeframe}`)
      const data = await res.json()

      if (data.groups) {
        setGroups(data.groups)
      }

      if (data.records) {
        const records: AggressionRecord[] = data.records
        let gapFound = false

        const rawGroupData = new Map<string, Map<number, number>>()
        const currentSaldos: Record<string, number> = {}

        data.groups.forEach((g: PlayerGroup) => {
          rawGroupData.set(g.id, new Map())
        })

        records.forEach((r) => {
          if (r.is_gap) gapFound = true
          const unixTime = Math.floor(new Date(r.timestamp).getTime() / 1000)
          
          if (rawGroupData.has(r.group_id)) {
            rawGroupData.get(r.group_id)!.set(unixTime, r.cumulative_net_volume)
            currentSaldos[r.group_id] = r.cumulative_net_volume
          }
        })

        let maxUnixTime = 0
        if (records.length > 0) {
          maxUnixTime = Math.floor(new Date(records[records.length - 1].timestamp).getTime() / 1000)
        } else {
          maxUnixTime = Math.floor(Date.now() / 1000)
        }

        let tfSeconds = 300 // 5m default
        if (timeframe === '15m') tfSeconds = 900
        else if (timeframe === '30m') tfSeconds = 1800
        else if (timeframe === '4h') tfSeconds = 14400
        else if (timeframe === '1d') {
          const d = new Date(maxUnixTime * 1000)
          d.setHours(9, 0, 0, 0)
          tfSeconds = maxUnixTime - Math.floor(d.getTime() / 1000)
          
          if (tfSeconds <= 0) {
            d.setHours(0, 0, 0, 0)
            tfSeconds = maxUnixTime - Math.floor(d.getTime() / 1000)
            if (tfSeconds <= 0) tfSeconds = 86400
          }
        }

        const startTime = maxUnixTime - tfSeconds

        const allTimestamps = new Set<number>()
        rawGroupData.forEach((timeMap) => {
          for (const t of timeMap.keys()) {
            allTimestamps.add(t)
          }
        })

        // Garante que o gráfico tenha pontos nos extremos do timeframe
        allTimestamps.add(startTime)
        allTimestamps.add(maxUnixTime)

        const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)
        const rechartsData: ChartPoint[] = []
        const lastValues: Record<string, number> = {}

        data.groups.forEach((g: PlayerGroup) => {
          lastValues[g.id] = 0
        })
        
        for (const ts of sortedTimestamps) {
          if (ts < startTime) continue
          
          const dateObj = new Date(ts * 1000)
          const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          
          const point: ChartPoint = {
            timeOriginal: ts,
            time: timeStr
          }
          
          data.groups.forEach((g: PlayerGroup) => {
            if (rawGroupData.get(g.id)?.has(ts)) {
              lastValues[g.id] = rawGroupData.get(g.id)!.get(ts)!
            }
            point[g.name] = lastValues[g.id]
          })
          
          rechartsData.push(point)
        }

        setDomainBounds([startTime, maxUnixTime])
        setChartData(rechartsData)
        setLatestSaldos(currentSaldos)
        setHasGap(gapFound)
      }
    } catch (e) {
      console.error('Erro ao carregar saldo de agressão:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 2000)
    return () => clearInterval(interval)
  }, [asset, timeframe])

  const handleReset = () => {
    setShowResetModal(true)
  }

  const confirmReset = async () => {
    setShowResetModal(false)
    try {
      setLoading(true)
      await fetch(`/api/aggression-balance?asset=${asset}`, { method: 'DELETE' })
      
      try {
        const ws = new WebSocket('ws://localhost:8080')
        ws.onopen = () => {
          ws.send(JSON.stringify({ action: 'reset_aggression' }))
          setTimeout(() => ws.close(), 500)
        }
      } catch (wsError) {
        console.error('Erro ao enviar comando WS para o bridge', wsError)
      }
      
      setTimeout(() => {
        loadData()
      }, 800)
      
    } catch (e) {
      console.error('Erro ao resetar dados:', e)
    }
  }

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 shadow-xl flex flex-col gap-3 h-full">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-emerald-400" size={20} />
          <h2 className="text-md font-bold text-white">Saldo de Agressão</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Seletor do Timeframe */}
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

          {/* Botões de Ação */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="flex items-center justify-center bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 p-1.5 rounded-xl transition"
              title="Zerar Histórico de Agressão"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela Compacta de Saldo por Grupo */}
      <div className="flex flex-col space-y-0.5 relative z-10 mb-2">
        {groups.map((group) => {
          const val = latestSaldos[group.id] || 0
          const isPositive = val >= 0
          return (
            <div key={group.id} className="flex justify-between items-center py-1.5 border-b border-[#1e293b]/50 last:border-0 relative pl-3">
              <div
                className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="text-xs text-slate-300 font-medium">{group.name}</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-sm font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? `+${val.toLocaleString()}` : val.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-500">cnts</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Aviso de Gap */}
      {hasGap && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-2 rounded-xl text-[11px] mb-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span>Gap de conexão com Profit detectado no período. Compensação aplicada via snapshot.</span>
        </div>
      )}

      {/* Gráfico Recharts */}
      <div className="flex-1 w-full min-h-0 relative mt-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="timeOriginal" 
                type="number"
                domain={domainBounds}
                stroke="#64748b" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
                tickFormatter={(ts) => new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => value.toString()}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b1120', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                labelFormatter={(label) => typeof label === 'number' ? new Date(label * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : label}
              />
              
              {groups.map((g) => (
                <Line 
                  key={g.id}
                  type="monotone" 
                  dataKey={g.name} 
                  stroke={g.color} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Carregando evolução de saldo...
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-400 text-sm mb-6">
              Tem certeza que deseja apagar todo o histórico de saldo de agressão do ativo <strong className="text-white">{asset}</strong>? Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-[#1e293b] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all"
              >
                Sim, Apagar Histórico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
