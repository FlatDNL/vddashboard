'use client'

import { useState, useEffect } from 'react'
import { Activity, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react'
import { useMarcacoesStore } from '@/store/marcacoes'
import { useMarketParamsStore } from '@/store/marketParams'
import { fetchMarcacoes } from '@/app/dashboard/operacional/marcacoes/actions'

type RulerPoint = {
  id: string
  label: string
  value: number
  type: 'support' | 'resistance' | 'neutral'
  strength: 'Forte' | 'Média' | 'Equilíbrio' | 'Institucional'
}

export function OperationalRulerWidget() {
  const { marcacoes } = useMarcacoesStore()
  const { manualFechamento, manualDxyPct } = useMarketParamsStore()
  
  const [points, setPoints] = useState<RulerPoint[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  const [profitDdeConnected, setProfitDdeConnected] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const formatPts = (val: number) => val.toFixed(1).replace('.', ',')

  useEffect(() => {
    setIsMounted(true)
    
    async function fetchPoints() {
      try {
        fetchMarcacoes().then(d => useMarcacoesStore.getState().setMarcacoes(d as any));
        const res = await fetch('/api/fair-value')
        if (res.ok && isMounted) {
          const data = await res.json()
          
          const baseJusto = manualFechamento !== null ? manualFechamento : data.justo
          const dxyVar = manualDxyPct !== null ? manualDxyPct : data.metrics.dxyPct

          const justissimoFinal = baseJusto * (1 + (dxyVar / 100))
          const maximaFinal = baseJusto + 35
          const minimaFinal = baseJusto - 36

          const newPoints: RulerPoint[] = [
            { id: 'max', label: 'MÁXIMA ESTIMADA', value: maximaFinal, type: 'resistance', strength: 'Forte' },
            { id: 'ajuste', label: 'AJUSTE ANTERIOR (Base)', value: baseJusto, type: 'resistance', strength: 'Institucional' },
            { id: 'justissimo', label: 'JUSTÍSSIMO MACRO', value: justissimoFinal, type: 'neutral', strength: 'Equilíbrio' },
            { id: 'min', label: 'MÍNIMA ESTIMADA', value: minimaFinal, type: 'support', strength: 'Forte' },
          ]
          
          setPoints(newPoints)
          setCurrentPrice(data.atual) // pre-populate with API before websocket
          setLoading(false)
        }
      } catch (e) {
        console.error('Erro Ruler:', e)
      }
    }
    
    fetchPoints()
    const interval = setInterval(fetchPoints, 60000) // update API data each minute
    return () => clearInterval(interval)
  }, [isMounted, manualFechamento, manualDxyPct])

  // Websocket logic
  useEffect(() => {
    let ws: WebSocket
    let reconnectTimer: any

    const connectWs = () => {
      ws = new WebSocket('ws://localhost:8080')
      
      ws.onopen = () => {
        setWsConnected(true)
        const savedTicker = localStorage.getItem('profit_ticker')
        if (savedTicker) {
          ws.send(JSON.stringify({ action: 'set_ticker', ticker: savedTicker }))
        }
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'market_data' && data.symbol === 'WDO$N') {
            setCurrentPrice(data.last)
          } else if (data.type === 'status') {
            setProfitDdeConnected(data.profitConnected)
          }
        } catch(e) {}
      }

      ws.onclose = () => {
        setWsConnected(false)
        setProfitDdeConnected(false)
        reconnectTimer = setTimeout(connectWs, 3000)
      }
      ws.onerror = () => {
        ws.close()
      }
    }

    if (isMounted) connectWs()

    return () => {
      if (ws) ws.close()
      clearTimeout(reconnectTimer)
    }
  }, [isMounted])

  if (loading || points.length === 0) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex items-center justify-center min-h-[400px] animate-pulse">
        <span className="text-slate-500 text-sm">Carregando Régua Operacional...</span>
      </div>
    )
  }

  const evaluatedPoints = [...points, ...marcacoes.map(m => ({ 
    id: m.id, 
    label: m.descricao.toUpperCase(), 
    value: m.preco, 
    type: 'neutral' as const, 
    strength: (m.importancia === 'Alta' ? 'Forte' : m.importancia === 'Média' ? 'Média' : 'Equilíbrio') as any 
  }))]
  .map(p => ({
    ...p,
    type: currentPrice < p.value ? 'resistance' : 'support'
  }))
  .sort((a, b) => b.value - a.value)

  // Filtrar para mostrar apenas os 5 pontos mais próximos acima (resistências) e 5 abaixo (suportes)
  const resistances = evaluatedPoints.filter(p => p.value > currentPrice).slice(-5)
  const supports = evaluatedPoints.filter(p => p.value <= currentPrice).slice(0, 5)
  const filteredPoints = [...resistances, ...supports]

  return (
    <div className="bg-[#0b1120] rounded-2xl border border-[#1e293b] flex flex-col h-full overflow-hidden min-h-[450px]">
      <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-blue-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Régua Operacional WDO</h2>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected && profitDdeConnected ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PROFIT AO VIVO
            </span>
          ) : wsConnected && !profitDdeConnected ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              ABRA O PROFIT PRO
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
              <RefreshCw size={10} className="animate-spin" />
              PONTE DESCONECTADA
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col relative overflow-hidden bg-gradient-to-b from-red-500/5 via-[#0b1120] to-emerald-500/5">
        <div className="absolute left-8 top-4 bottom-4 w-px bg-[#1e293b]/50 z-0"></div>

        <div className="flex-1 flex flex-col justify-center gap-1 relative z-10">
          {(() => {
            const elements = []
            let priceInserted = false

            filteredPoints.forEach((point, idx) => {
              if (!priceInserted && currentPrice >= point.value) {
                elements.push(
                  <div key="current-price" className="relative flex items-center gap-4 my-3 group">
                    <div className="absolute left-0 right-0 h-[1px] bg-blue-500/40 w-full z-0 group-hover:bg-blue-400 transition-colors shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-[#0b1120] z-10 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.8)] flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                    <div className="z-10 bg-blue-600 px-3 py-1.5 rounded-lg border border-blue-400 shadow-lg flex items-center gap-3">
                      <span className="text-xs font-bold text-white tracking-widest">WDO ATUAL</span>
                      <span className="text-base font-black text-white font-mono">{formatPts(currentPrice)}</span>
                    </div>
                  </div>
                )
                priceInserted = true
              }

              const isRes = point.type === 'resistance'
              const dist = Math.abs(currentPrice - point.value)
              const color = isRes ? 'text-red-400' : 'text-emerald-400'
              const bgBadge = isRes ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'

              elements.push(
                <div key={point.id} className="relative flex items-center gap-4 py-2 hover:bg-[#1e293b]/30 rounded-lg transition-colors px-2 -mx-2">
                  <div className={`w-2 h-2 rounded-full ${isRes ? 'bg-red-500/50' : 'bg-emerald-500/50'} ml-1 z-10 shrink-0`}></div>
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold font-mono ${color}`}>{formatPts(point.value)}</span>
                        <span className="text-xs font-semibold text-slate-300">{point.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-medium">[{point.strength}]</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${bgBadge} ${color} flex items-center gap-1`}>
                         {isRes ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                         {formatPts(dist)} pts
                       </span>
                    </div>
                  </div>
                </div>
              )
            })

            if (!priceInserted) {
                elements.push(
                  <div key="current-price" className="relative flex items-center gap-4 my-3 group">
                    <div className="absolute left-0 right-0 h-[1px] bg-blue-500/40 w-full z-0 group-hover:bg-blue-400 transition-colors shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-[#0b1120] z-10 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.8)] flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                    <div className="z-10 bg-blue-600 px-3 py-1.5 rounded-lg border border-blue-400 shadow-lg flex items-center gap-3">
                      <span className="text-xs font-bold text-white tracking-widest">WDO ATUAL</span>
                      <span className="text-base font-black text-white font-mono">{formatPts(currentPrice)}</span>
                    </div>
                  </div>
                )
            }

            return elements
          })()}
        </div>
      </div>
    </div>
  )
}
