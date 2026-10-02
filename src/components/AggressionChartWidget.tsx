'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, LineSeries, UTCTimestamp } from 'lightweight-charts'
import { Activity, RefreshCw, AlertTriangle, Layers } from 'lucide-react'
import Link from 'next/link'

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

export function AggressionChartWidget() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())

  const [asset, setAsset] = useState('WDOX26')
  const [groups, setGroups] = useState<PlayerGroup[]>([])
  const [latestSaldos, setLatestSaldos] = useState<Record<string, number>>({})
  const [hasGap, setHasGap] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/aggression-balance?asset=${asset}`)
      const data = await res.json()

      if (data.groups) {
        setGroups(data.groups)
      }

      if (data.records && chartRef.current) {
        const records: AggressionRecord[] = data.records
        let gapFound = false

        const groupDataMap = new Map<string, { time: UTCTimestamp; value: number }[]>()
        const currentSaldos: Record<string, number> = {}

        data.groups.forEach((g: PlayerGroup) => {
          groupDataMap.set(g.id, [])
        })

        records.forEach((r) => {
          if (r.is_gap) gapFound = true
          const unixTime = (Math.floor(new Date(r.timestamp).getTime() / 1000)) as UTCTimestamp
          
          if (groupDataMap.has(r.group_id)) {
            const groupData = groupDataMap.get(r.group_id)!
            
            // Se já existe um dado no mesmo segundo, atualiza o valor em vez de dar push
            if (groupData.length > 0 && groupData[groupData.length - 1].time === unixTime) {
              groupData[groupData.length - 1].value = r.cumulative_net_volume
            } else {
              groupData.push({
                time: unixTime,
                value: r.cumulative_net_volume,
              })
            }
            
            currentSaldos[r.group_id] = r.cumulative_net_volume
          }
        })

        setLatestSaldos(currentSaldos)
        setHasGap(gapFound)

        const currentGroupIds = new Set(data.groups.map((g: PlayerGroup) => g.id))

        data.groups.forEach((g: PlayerGroup) => {
          let series = seriesMapRef.current.get(g.id)
          
          if (!series) {
            series = chartRef.current!.addSeries(LineSeries, {
              color: g.color,
              lineWidth: 2,
              title: g.name,
              priceFormat: {
                type: 'volume',
              },
            })
            seriesMapRef.current.set(g.id, series)
          } else {
            series.applyOptions({ color: g.color, title: g.name })
          }

          const seriesData = groupDataMap.get(g.id) || []
          series.setData(seriesData)
        })

        // Remove séries de grupos que foram deletados
        for (const [id, series] of Array.from(seriesMapRef.current.entries())) {
          if (!currentGroupIds.has(id)) {
            try {
              chartRef.current?.removeSeries(series)
            } catch (e) {}
            seriesMapRef.current.delete(id)
          }
        }

        chartRef.current.timeScale().fitContent()
      }
    } catch (e) {
      console.error('Erro ao carregar saldo de agressão:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 350,
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: '#1e293b',
      },
    })

    chartRef.current = chart

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    loadData()

    const interval = setInterval(loadData, 2000)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(interval)
      if (chartRef.current) {
        chartRef.current.remove()
      }
    }
  }, [asset])

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-emerald-400" size={20} />
          <h2 className="text-md font-bold text-white">Evolução do Saldo de Agressão</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor do Ativo */}
          <div className="flex items-center bg-[#1e293b] rounded-xl p-1 border border-slate-700">
            {['WDOX26', 'WDOFUT', 'WING26', 'PETR4'].map((item) => (
              <button
                key={item}
                onClick={() => setAsset(item)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  asset === item
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <Link
            href="/dashboard/operacional/grupos-players"
            className="flex items-center gap-1 bg-blue-900/30 text-blue-400 border border-blue-500/30 hover:bg-blue-900/50 text-[11px] px-2.5 py-1.5 rounded-xl transition font-medium"
            title="Configurar Grupos"
          >
            <Layers size={13} /> Grupos
          </Link>
        </div>
      </div>

      {/* Mini Cards de Saldo por Grupo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {groups.map((group) => {
          const val = latestSaldos[group.id] || 0
          const isPositive = val >= 0
          return (
            <div
              key={group.id}
              className="bg-[#1e293b]/40 border border-[#1e293b] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="text-[11px] text-slate-400 font-medium pl-1">{group.name}</span>
              <div className="flex items-baseline justify-between mt-1 pl-1">
                <span className={`text-md font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
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
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-2 rounded-xl text-[11px]">
          <AlertTriangle size={14} className="shrink-0" />
          <span>Gap de conexão com Profit detectado no período. Compensação aplicada via snapshot.</span>
        </div>
      )}

      {/* Gráfico TradingView */}
      <div className="relative w-full">
        <div ref={chartContainerRef} className="w-full h-[350px] rounded-xl overflow-hidden" />
      </div>
    </div>
  )
}
