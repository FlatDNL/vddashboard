'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Maximize, Minimize, X } from 'lucide-react'
import { useMarketParamsStore } from '@/store/marketParams'
import { createClient } from '@/utils/supabase/client'

// Utilidades para formatar números
const formatPts = (val: number) => (Math.round(val * 2) / 2).toFixed(1).replace('.', ',')
const formatPct = (val: number | undefined) => {
  if (val === undefined) return '---'
  const sign = val > 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}%`.replace('.', ',')
}
const formatPrice = (val: number | undefined, decimals = 2) => {
  if (val === undefined) return '---'
  return val.toFixed(decimals).replace('.', ',')
}

// Símbolos do Yahoo Finance
const SYMBOLS = [
  'DX-Y.NYB', // DXY
  'EURUSD=X',
  'JPY=X',    // USD/JPY
  'MXN=X',
  'ZAR=X',
  'TRY=X',
  'BRL=X',
  '^GSPC',    // S&P 500
  '^IXIC',    // NASDAQ
  '^VIX',
  '^TNX',     // UST 10Y
  '^BVSP',    // IBOV
  'EWZ',
  'CL=F',     // WTI Oil
  'GC=F',     // Gold
  'HG=F',     // Copper
]

export default function BloombergTerminal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Erro ao tentar modo tela cheia: ${err.message}`)
      })
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  const [quotes, setQuotes] = useState<Record<string, any>>({})
  const [fairValue, setFairValue] = useState<any>(null)
  const [risk, setRisk] = useState<any>(null)
  const [news, setNews] = useState<any[]>([])
  const [aggression, setAggression] = useState<any[]>([])
  const [fluxoIa, setFluxoIa] = useState<any>(null)
  const lastRealtimeTs = useRef<number>(0)
  const { manualFechamento, manualDxyPct } = useMarketParamsStore()
  
  const [nowTimer, setNowTimer] = useState(new Date())
  const [activeModalTime, setActiveModalTime] = useState<string | null>(null)
  const triggeredModals = useRef<Set<string>>(new Set())
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeModalTime) return;
    const modalEvents = news.filter(n => n.dateIso === activeModalTime);
    if (modalEvents.length > 0) {
      // Checa se TODOS os eventos deste horário já tiveram a pressão calculada
      const allCalculated = modalEvents.every(e => e.pressure?.direction && e.pressure.direction !== 'AGUARDANDO');
      if (allCalculated) {
        const t = setTimeout(() => {
          setActiveModalTime(null);
        }, 10000);
        return () => clearTimeout(t);
      }
    }
  }, [activeModalTime, news]);


  useEffect(() => {
    const interval = setInterval(() => setNowTimer(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    const currentMs = nowTimer.getTime()
    news.forEach(item => {
      if (!item.dateIso) return
      const eventMs = new Date(item.dateIso).getTime()
      const diffSeconds = Math.floor((eventMs - currentMs) / 1000)
      
      // Faltando 5 segundos para a noticia
      if (diffSeconds <= 5 && diffSeconds > -300 && !triggeredModals.current.has(item.dateIso)) {
        triggeredModals.current.add(item.dateIso)
        setActiveModalTime(item.dateIso)
      }
    })
  }, [nowTimer, news])




  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const fvParams = new URLSearchParams()
        if (manualFechamento !== null) fvParams.set('base', manualFechamento.toString())
        if (manualDxyPct !== null) fvParams.set('dxy', manualDxyPct.toString())
        const fvQuery = fvParams.toString()
        const fvUrl = fvQuery ? `/api/fair-value?${fvQuery}` : '/api/fair-value'

        const [quotesRes, fvRes, riskRes, calendarRes, aggRes, fluxoRes] = await Promise.all([
          fetch(`/api/quotes?symbols=${SYMBOLS.join(',')}`),
          fetch(fvUrl),
          fetch('/api/risk'),
          fetch('/api/calendar'),
          fetch('/api/aggression-balance'),
          fetch('/api/fluxo-ia')
        ])

        const [quotesData, fvData, riskData, calendarData, aggData, fluxoData] = await Promise.all([
          quotesRes.json().catch(() => ({})),
          fvRes.json().catch(() => null),
          riskRes.json().catch(() => null),
          calendarRes.json().catch(() => ({ events: [] })),
          aggRes.json().catch(() => ({ groups: [], records: [] })),
          fluxoRes.json().catch(() => null)
        ])

        if (!isMounted) return

        setQuotes(quotesData)
        setFairValue(fvData)
        setRisk(riskData)
        if (Date.now() - lastRealtimeTs.current > 3000) {
          setFluxoIa(fluxoData)
        }
        
        // News (now Events)
        const eventsList = calendarData?.events || []
        const now = new Date()
        const hh = String(now.getHours()).padStart(2, '0')
        const mm = String(now.getMinutes()).padStart(2, '0')
        const currentTime = `${hh}:${mm}`
        
        // Ensure we parse time safely, assuming format "HH:MM"
        const upcomingEvents = eventsList.filter((e: any) => {
          if (!e.time || typeof e.time !== 'string') return false
          const timeStr = e.time.trim()
          return timeStr >= currentTime
        })
        setNews(upcomingEvents.slice(0, 15)) // Top 15 upcoming events

        // Aggression: pegar saldo acumulado final por grupo
        const groups = aggData.groups || []
        const records = aggData.records || []
        const latestByGroup: Record<string, number> = {}
        
        // As records are reversed (old to new), the last occurrence is the latest
        records.forEach((r: any) => {
          latestByGroup[r.group_id] = r.cumulative_net_volume
        })
        
        const aggFinal = groups.map((g: any) => ({
          name: g.name,
          color: g.color,
          value: latestByGroup[g.id] || 0
        }))
        setAggression(aggFinal)

        setLoading(false)
      } catch (e) {
        console.error('Error fetching dashboard data:', e)
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)

    // Canal Supabase Realtime Broadcast para receber o Fluxo IA Master online em tempo real
    const supabase = createClient()
    const channel = supabase
      .channel('fluxo_ia')
      .on('broadcast', { event: 'status' }, (msg) => {
        if (isMounted && msg?.payload) {
          lastRealtimeTs.current = Date.now()
          setFluxoIa({ online: true, ...msg.payload })
        }
      })
      .subscribe()

    // Fallback local de alta frequência caso esteja rodando localmente sem broadcast recente
    const fluxoFastInterval = setInterval(async () => {
      if (Date.now() - lastRealtimeTs.current < 3000) {
        return
      }
      try {
        const res = await fetch('/api/fluxo-ia')
        if (res.ok && isMounted) {
          const data = await res.json()
          if (Date.now() - lastRealtimeTs.current >= 3000) {
            setFluxoIa(data)
          }
        }
      } catch {}
    }, 500)

    return () => {
      isMounted = false
      clearInterval(interval)
      clearInterval(fluxoFastInterval)
      supabase.removeChannel(channel)
    }
  }, [manualFechamento, manualDxyPct])

  if (loading) {
    return (
      <div className="flex h-screen bg-[#111111] items-center justify-center text-gray-500 font-mono text-base">
        LOADING TERMINAL...
      </div>
    )
  }

  // Helpers components for UI
  const ValChange = ({ val, big }: { val: number | undefined, big?: boolean }) => {
    if (val === undefined) return <span className="text-gray-500">---</span>
    const color = val > 0 ? 'text-[#22c55e]' : val < 0 ? 'text-[#ef4444]' : 'text-gray-400'
    const icon = val > 0 ? '↗' : val < 0 ? '↘' : ''
    const size = big ? 'text-3xl' : 'text-base'
    return (
      <span className={`inline-flex items-center gap-1 whitespace-nowrap ${color} font-mono ${size}`}>
        {formatPct(val)} {icon}
      </span>
    )
  }

  const RiskBar = ({ score, status }: { score: number, status: string }) => {
    const pct = Math.max(0, Math.min(100, (score + 100) / 2))
    const isRiskOn = status === 'RISK ON' || score > 0
    const color = isRiskOn ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
    const arrowColor = isRiskOn ? 'text-[#ef4444]' : 'text-[#22c55e]'
    return (
      <div className="flex justify-between items-end w-full text-sm font-mono text-gray-400">
        <div className="flex flex-col leading-tight">
          <span className="text-gray-500 mb-1">IMPACTO NO DÓLAR</span>
          <span className="text-gray-200">DÓLAR <span className={arrowColor}>{isRiskOn ? '↓' : '↑'}</span></span>
        </div>
        <div className="flex items-center gap-2 mb-0.5">
          <span>FORÇA</span>
          <div className="w-32 h-2.5 flex gap-[2px]">
            {Array.from({ length: 10 }).map((_, i) => (
               <div key={i} className={`h-full flex-1 ${i < (pct / 10) ? color : 'bg-[#333]'}`} />
            ))}
          </div>
          <span className="w-8 text-right text-gray-200">{pct.toFixed(0)}%</span>
        </div>
      </div>
    )
  }

  const wdoScore = risk?.wdo?.score || 0
  const globalScore = risk?.global?.score || 0
  const brazilScore = risk?.brazil?.score || 0

  return (
    <div ref={containerRef} className="min-h-screen bg-[#121212] text-[#e2e8f0] p-4 font-mono uppercase selection:bg-gray-700 relative group flex flex-col h-screen overflow-hidden">
      
      {/* Botão de Tela Cheia */}
      <div className="absolute top-4 left-4 z-50 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-gray-300 px-3 py-1.5 rounded border border-[#444] transition-all shadow-xl"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          <span className="text-sm font-semibold">{isFullscreen ? 'SAIR' : 'TELA CHEIA'}</span>
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col gap-3 flex-1 overflow-hidden">
        
        {/* ROW 1: Risco Global | Risco Brasil */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          {/* Risco Global */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col justify-center overflow-hidden">
            <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center shrink-0">
              🌍 RISCO GLOBAL
            </div>
            <div className="p-3 px-4 flex flex-col justify-center flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${
                  risk?.global?.status?.toUpperCase() === 'RISK ON' ? 'text-[#22c55e]' : 
                  risk?.global?.status?.toUpperCase() === 'RISK OFF' ? 'text-[#ef4444]' : 'text-yellow-500'
                }`}>
                  {risk?.global?.status || 'NEUTRO'} {globalScore > 0 ? '+' : ''}{globalScore.toFixed(0)}
                </span>
                <div className="flex flex-col xl:flex-row gap-1 xl:gap-6 text-base font-mono items-end xl:items-center">
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">S&P</span>
                     <ValChange val={quotes['^GSPC']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">DXY</span>
                     <ValChange val={quotes['DX-Y.NYB']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">UST10Y</span>
                     <ValChange val={quotes['^TNX']?.changePercent} />
                   </div>
                </div>
              </div>
              <div className="border-t border-[#333] w-full my-2.5"></div>
              <RiskBar score={globalScore} status={risk?.global?.status} />
            </div>
          </div>

          {/* Risco Brasil */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col justify-center overflow-hidden">
            <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center shrink-0">
              🇧🇷 RISCO BRASIL
            </div>
            <div className="p-3 px-4 flex flex-col justify-center flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${
                  risk?.brazil?.status?.toUpperCase() === 'RISK ON' ? 'text-[#22c55e]' : 
                  risk?.brazil?.status?.toUpperCase() === 'RISK OFF' ? 'text-[#ef4444]' : 'text-yellow-500'
                }`}>
                  {risk?.brazil?.status || 'NEUTRO'} {brazilScore > 0 ? '+' : ''}{brazilScore.toFixed(0)}
                </span>
                <div className="flex flex-col xl:flex-row gap-1 xl:gap-6 text-base font-mono items-end xl:items-center">
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">IBOV</span>
                     <ValChange val={quotes['^BVSP']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">EWZ</span>
                     <ValChange val={quotes['EWZ']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">DI</span>
                     <ValChange val={undefined} />
                   </div>
                </div>
              </div>
              <div className="border-t border-[#333] w-full my-2.5"></div>
              <RiskBar score={brazilScore} status={risk?.brazil?.status} />
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Grid 12 cols */}
        <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
          
          {/* Left Column (col-span-8) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-3 min-h-0">
            
            {/* ROW 2: Dólar (Now inside left col) */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col overflow-hidden shrink-0">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                💵 DÓLAR
              </div>
              <div className="p-4 px-6 flex justify-between items-center">
                <div className="flex items-baseline gap-6">
                  <span className="text-6xl font-bold text-white tracking-tighter">
                    {fairValue?.atual ? (fairValue.atual / 1000).toFixed(4) : '---'}
                  </span>
                  <ValChange val={quotes['BRL=X']?.changePercent} big />
                </div>
                {/* WDO Pressure Button (Massive) */}
                {risk?.wdo?.action && (
                  <div className={`px-10 py-3 rounded-md font-black text-4xl shadow-md tracking-wider ${
                     risk.wdo.action.toUpperCase().includes('COMPRA') ? 'bg-[#22c55e] text-white' : 
                     risk.wdo.action.toUpperCase().includes('VENDA') ? 'bg-[#ef4444] text-white' : 'bg-yellow-500 text-black'
                  }`}>
                    {risk.wdo.action.toUpperCase().includes('COMPRA') ? 'COMPRA' : 
                     risk.wdo.action.toUpperCase().includes('VENDA') ? 'VENDA' : 'NEUTRO'}
                  </div>
                )}
              </div>
            </div>

            {/* FLUXO IA MASTER — REVERSÃO INSTITUCIONAL (BLOOMBERG STYLE) */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md shrink-0 overflow-hidden flex flex-col">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🤖 FLUXO IA MASTER // REVERSÃO VWAP</span>
                  <span className="text-[11px] text-gray-400 font-normal">[{fluxoIa?.ativo || 'WDO'}]</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    VWAP: {fluxoIa?.vwap ? formatPts(fluxoIa.vwap) : '---'} | DIST: {fluxoIa?.dist_pts !== undefined ? `${fluxoIa.dist_pts > 0 ? '+' : ''}${formatPts(fluxoIa.dist_pts)}` : '---'} | Z: {fluxoIa?.z_score !== undefined ? `${fluxoIa.z_score > 0 ? '+' : ''}${fluxoIa.z_score.toFixed(2)}σ` : '---'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    fluxoIa?.online ? 'bg-emerald-950 text-[#22c55e] border border-emerald-800' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {fluxoIa?.online ? 'MT5 LIVE' : 'MT5 OFFLINE'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 px-4 flex flex-col gap-3">
                {/* 1. SEÇÃO FORÇA DE AGRESSÃO + CRITÉRIOS DE VALIDAÇÃO (CHECKLIST) */}
                {(() => {
                  const d10 = fluxoIa?.delta_10s ?? 0
                  const d30 = fluxoIa?.delta_30s ?? 0
                  const distAbs = fluxoIa?.dist_abs ?? 0
                  const distPts = fluxoIa?.dist_pts ?? 0
                  const zScore = fluxoIa?.z_score ?? 0
                  const inCooldown = fluxoIa?.em_cooldown ?? false
                  const cooldownSec = fluxoIa?.cooldown_restante_seg ?? 0

                  // Normalização da barra de força (escala até +-400 contratos de D10s)
                  const maxLimit = 350
                  const clampedD10 = Math.max(-maxLimit, Math.min(maxLimit, d10))
                  const pctVenda = clampedD10 < 0 ? (Math.abs(clampedD10) / maxLimit) * 100 : 0
                  const pctCompra = clampedD10 > 0 ? (clampedD10 / maxLimit) * 100 : 0

                  // Checklist 1: Afastamento VWAP (Esperado: 10 a 22 pts)
                  let vwapStatus: 'green' | 'yellow' | 'red' = 'red'
                  let vwapLabel = `${distPts > 0 ? '+' : ''}${formatPts(distPts)} pts`
                  if (distAbs >= 10.0 && distAbs <= 22.0) {
                    vwapStatus = 'green'
                  } else if ((distAbs >= 7.0 && distAbs < 10.0) || (distAbs > 22.0 && distAbs <= 26.0)) {
                    vwapStatus = 'yellow'
                  }

                  // Checklist 2: Z-Score (Esperado: |Z| >= 1.80)
                  let zStatus: 'green' | 'yellow' | 'red' = 'red'
                  const absZ = Math.abs(zScore)
                  if (absZ >= 1.8) {
                    zStatus = 'green'
                  } else if (absZ >= 1.3) {
                    zStatus = 'yellow'
                  }

                  // Checklist 3: D10s Agressão Reação (Esperado: |D10| >= 100 no sentido correto)
                  // Se zScore > 0 estamos na máxima (espera venda: D10 <= -100). Se zScore < 0 estamos na mínima (espera compra: D10 >= 100).
                  let d10Status: 'green' | 'yellow' | 'red' = 'red'
                  if (zScore > 0) {
                    if (d10 <= -100) d10Status = 'green'
                    else if (d10 < -25) d10Status = 'yellow'
                  } else if (zScore < 0) {
                    if (d10 >= 100) d10Status = 'green'
                    else if (d10 > 25) d10Status = 'yellow'
                  } else {
                    if (Math.abs(d10) >= 100) d10Status = 'yellow'
                  }

                  // Checklist 4: D30s Filtro Institucional (Não pode ter agressão contra > 500)
                  let d30Status: 'green' | 'yellow' | 'red' = 'green'
                  if (zScore > 0 && d30 >= 500) d30Status = 'red'
                  else if (zScore < 0 && d30 <= -500) d30Status = 'red'
                  else if (zScore > 0 && d30 >= 250) d30Status = 'yellow'
                  else if (zScore < 0 && d30 <= -250) d30Status = 'yellow'

                  // Checklist 5: Cooldown
                  let cdStatus: 'green' | 'yellow' | 'red' = inCooldown ? 'yellow' : 'green'

                  const badgeClass = (st: 'green' | 'yellow' | 'red') => {
                    if (st === 'green') return 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300'
                    if (st === 'yellow') return 'bg-amber-950/70 border-amber-500/80 text-amber-300'
                    return 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                  }

                  const dotClass = (st: 'green' | 'yellow' | 'red') => {
                    if (st === 'green') return 'bg-emerald-400 shadow-[0_0_8px_#22c55e]'
                    if (st === 'yellow') return 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                    return 'bg-rose-500 shadow-[0_0_6px_#ef4444]'
                  }

                  return (
                    <div className="flex flex-col gap-2.5">
                      {/* BARRA DE FORÇA DE AGRESSÃO BIPOLAR */}
                      <div className="bg-[#121212] border border-[#2d2d2d] rounded-lg p-2.5 flex flex-col gap-1.5 shadow-inner">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <div className="flex items-center gap-1.5 text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            <span>AGRESSÃO VENDEDORA</span>
                            {d10 < 0 && (
                              <span className="font-mono text-sm font-black ml-1 text-rose-300">
                                {d10} cnt
                              </span>
                            )}
                          </div>

                          <div className="text-center font-mono text-[10px] text-gray-400">
                            DELTA 10s: <strong className={d10 > 0 ? 'text-emerald-400 font-bold' : d10 < 0 ? 'text-rose-400 font-bold' : 'text-gray-300'}>{d10 > 0 ? `+${d10}` : d10}</strong> | D30s: <strong className={d30 > 0 ? 'text-emerald-400' : d30 < 0 ? 'text-rose-400' : 'text-gray-400'}>{d30 > 0 ? `+${d30}` : d30}</strong>
                          </div>

                          <div className="flex items-center gap-1.5 text-emerald-400">
                            {d10 > 0 && (
                              <span className="font-mono text-sm font-black mr-1 text-emerald-300">
                                +{d10} cnt
                              </span>
                            )}
                            <span>AGRESSÃO COMPRADORA</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          </div>
                        </div>

                        {/* Barra com divisor central neutro */}
                        <div className="h-4 bg-[#1f1f1f] rounded relative flex overflow-hidden border border-[#333]">
                          {/* Lado Vendedor (da metade para a esquerda) */}
                          <div className="w-1/2 h-full flex justify-end bg-[#161616] relative border-r border-[#444]">
                            <div
                              className="h-full bg-gradient-to-l from-rose-600 to-rose-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                              style={{ width: `${pctVenda}%` }}
                            />
                            {/* Marca de gatilho 100 contratos */}
                            <div
                              className="absolute top-0 bottom-0 border-l border-dashed border-rose-300/40"
                              style={{ right: `${(100 / maxLimit) * 100}%` }}
                              title="Gatilho 100 contratos"
                            />
                          </div>

                          {/* Lado Comprador (da metade para a direita) */}
                          <div className="w-1/2 h-full flex justify-start bg-[#161616] relative">
                            {/* Marca de gatilho 100 contratos */}
                            <div
                              className="absolute top-0 bottom-0 border-r border-dashed border-emerald-300/40"
                              style={{ left: `${(100 / maxLimit) * 100}%` }}
                              title="Gatilho 100 contratos"
                            />
                            <div
                              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                              style={{ width: `${pctCompra}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* QUADRADOS / BADGES DE CHECKLIST OPERACIONAL */}
                      <div className="grid grid-cols-5 gap-2">
                        {/* 1. DISTÂNCIA VWAP */}
                        <div className={`border rounded p-2 flex flex-col justify-between transition-all ${badgeClass(vwapStatus)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Afast. VWAP</span>
                            <span className={`w-2.5 h-2.5 rounded-sm ${dotClass(vwapStatus)}`} />
                          </div>
                          <span className="text-sm font-mono font-black mt-1">{vwapLabel}</span>
                          <span className="text-[9px] text-gray-400">Meta: 10 - 22 pts</span>
                        </div>

                        {/* 2. Z-SCORE */}
                        <div className={`border rounded p-2 flex flex-col justify-between transition-all ${badgeClass(zStatus)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Fator Z (σ)</span>
                            <span className={`w-2.5 h-2.5 rounded-sm ${dotClass(zStatus)}`} />
                          </div>
                          <span className="text-sm font-mono font-black mt-1">
                            {zScore !== undefined ? `${zScore > 0 ? '+' : ''}${zScore.toFixed(2)}σ` : '---'}
                          </span>
                          <span className="text-[9px] text-gray-400">Meta: |Z| ≥ 1.80</span>
                        </div>

                        {/* 3. DELTA 10s */}
                        <div className={`border rounded p-2 flex flex-col justify-between transition-all ${badgeClass(d10Status)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Delta 10s</span>
                            <span className={`w-2.5 h-2.5 rounded-sm ${dotClass(d10Status)}`} />
                          </div>
                          <span className="text-sm font-mono font-black mt-1">
                            {d10 !== undefined ? `${d10 > 0 ? '+' : ''}${d10}` : '---'}
                          </span>
                          <span className="text-[9px] text-gray-400">Gatilho: ≥ 100 cnt</span>
                        </div>

                        {/* 4. DELTA 30s */}
                        <div className={`border rounded p-2 flex flex-col justify-between transition-all ${badgeClass(d30Status)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Filtro D30s</span>
                            <span className={`w-2.5 h-2.5 rounded-sm ${dotClass(d30Status)}`} />
                          </div>
                          <span className="text-sm font-mono font-black mt-1">
                            {d30 !== undefined ? `${d30 > 0 ? '+' : ''}${d30}` : '---'}
                          </span>
                          <span className="text-[9px] text-gray-400">Sem barreira contra</span>
                        </div>

                        {/* 5. COOLDOWN / STATUS */}
                        <div className={`border rounded p-2 flex flex-col justify-between transition-all ${badgeClass(cdStatus)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Repique/Cooldown</span>
                            <span className={`w-2.5 h-2.5 rounded-sm ${dotClass(cdStatus)}`} />
                          </div>
                          <span className="text-sm font-mono font-black mt-1">
                            {inCooldown ? `${cooldownSec}s` : 'LIBERADO'}
                          </span>
                          <span className="text-[9px] text-gray-400">{inCooldown ? 'Em pausa técnica' : 'Pronto para entrada'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Linha de Status Principal */}
                <div className="flex items-center justify-between pt-1 border-t border-[#252525]">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs tracking-wider">ESTADO DO GATILHO:</span>
                    {(() => {
                      const st = fluxoIa?.estado || 'NEUTRO'
                      if (st === 'PREPARAR_COMPRA') {
                        return (
                          <div className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded font-black text-sm tracking-wide animate-pulse">
                            ⚠️ PREPARAR COMPRA (EXAUSTÃO VENDEDORA)
                          </div>
                        )
                      }
                      if (st === 'PREPARAR_VENDA') {
                        return (
                          <div className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded font-black text-sm tracking-wide animate-pulse">
                            ⚠️ PREPARAR VENDA (EXAUSTÃO COMPRADORA)
                          </div>
                        )
                      }
                      if (st === 'COMPRA' || (st === 'EM_OPERACAO' && fluxoIa?.sinal?.tipo === 'COMPRA')) {
                        return (
                          <div className="px-3 py-1 bg-emerald-500/20 text-[#22c55e] border border-emerald-500 rounded font-black text-sm tracking-wide shadow-[0_0_12px_rgba(34,197,94,0.3)]">
                            ⚡ COMPRA CONFIRMADA (GATILHO ATIVO)
                          </div>
                        )
                      }
                      if (st === 'VENDA' || (st === 'EM_OPERACAO' && fluxoIa?.sinal?.tipo === 'VENDA')) {
                        return (
                          <div className="px-3 py-1 bg-rose-500/20 text-[#ef4444] border border-rose-500 rounded font-black text-sm tracking-wide shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                            ⚡ VENDA CONFIRMADA (GATILHO ATIVO)
                          </div>
                        )
                      }
                      if (st === 'COOLDOWN') {
                        return (
                          <div className="px-3 py-1 bg-blue-950 text-blue-400 border border-blue-800 rounded font-bold text-xs tracking-wide">
                            ⏱️ COOLDOWN ({fluxoIa?.cooldown_restante_seg || 0}s)
                          </div>
                        )
                      }
                      return (
                        <div className="px-3 py-1 bg-[#252525] text-gray-400 border border-[#3a3a3a] rounded font-bold text-xs tracking-wide">
                          ⚪ NEUTRO (MONITORANDO FAIXA VWAP)
                        </div>
                      )
                    })()}
                  </div>

                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span>PREÇO ATUAL: <strong className="text-white font-mono">{fluxoIa?.preco_atual ? formatPts(fluxoIa.preco_atual) : '---'}</strong></span>
                    <span className="text-gray-600">|</span>
                    <span>TICK: {fluxoIa?.updatedAtStr ?? '---'}</span>
                  </div>
                </div>

                {/* Parâmetros Operacionais (Entrada, Stop, Alvo) */}
                {fluxoIa?.sinal && (fluxoIa.estado?.startsWith('PREPARAR') || fluxoIa.estado === 'COMPRA' || fluxoIa.estado === 'VENDA' || fluxoIa.estado === 'EM_OPERACAO') ? (
                  <div className="grid grid-cols-4 gap-2 bg-[#141414] border border-[#333] rounded p-2.5 text-center mt-0.5">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block">ENTRADA REF</span>
                      <span className="text-lg font-black text-white">{formatPts(fluxoIa.sinal.entrada)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#ef4444] font-bold block">STOP LOSS (-{fluxoIa.sinal.pts_stop} PTS)</span>
                      <span className="text-lg font-black text-[#ef4444]">{formatPts(fluxoIa.sinal.stop)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block">PARCIAL (+{fluxoIa.sinal.pts_parcial} PTS)</span>
                      <span className="text-lg font-black text-emerald-400">{formatPts(fluxoIa.sinal.parcial)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#22c55e] font-bold block">ALVO FINAL (+{fluxoIa.sinal.pts_alvo} PTS)</span>
                      <span className="text-lg font-black text-[#22c55e]">{formatPts(fluxoIa.sinal.alvo)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-500 flex justify-between items-center border-t border-[#252525] pt-1">
                    <span>GESTÃO: STOP 8.0 PTS | PARCIAL +5.0 PTS (MOVE PARA 0.0) | ALVO +10.0 PTS</span>
                    <span>{fluxoIa?.updatedAtStr ? `ÚLTIMO TICK: ${fluxoIa.updatedAtStr}` : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Left Grid: Eventos (col-span-8) | Preço/Níveis (col-span-4) */}
            <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
              
              {/* Eventos */}
              <div className="col-span-8 bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col min-h-0 overflow-hidden">
                <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center shrink-0">
                   📄 NOTÍCIAS AO VIVO
                </div>
                <div className="p-4 pt-0 overflow-y-auto flex-1 flex flex-col">
                  <div className="overflow-y-auto flex-1 mt-3">
                    <table className="w-full text-left text-sm font-mono">
                      <thead className="sticky top-0 bg-[#1c1c1c]">
                        <tr className="text-gray-500 border-b border-[#333]">
                          <th className="py-1 px-1 font-normal">HORA</th>
                          <th className="py-1 px-1 font-normal">PAÍS</th>
                          <th className="py-1 px-1 font-normal">EVENTO</th>
                          <th className="py-1 px-1 font-normal">IMPACTO</th>
                          <th className="py-1 px-1 font-normal text-right">ATUAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {news.map((item, i) => {
                          const isHigh = item.impact === 'HIGH'
                          const isMed = item.impact === 'MEDIUM'
                          const impactText = isHigh ? 'ALTO' : isMed ? 'MÉDIO' : 'BAIXO'
                          const impactColor = isHigh ? 'text-[#ef4444]' : isMed ? 'text-yellow-400' : 'text-[#22c55e]'
                          
                          let rowClass = "border-b border-[#222] hover:bg-[#333] transition-colors leading-tight"
                          let displayTime = item.time
                          let textTimeClass = "text-gray-400"
                          
                          if (item.dateIso) {
                            const diffSeconds = Math.floor((new Date(item.dateIso).getTime() - nowTimer.getTime()) / 1000)
                            if (diffSeconds > 0 && diffSeconds <= 300) {
                              const m = Math.floor(diffSeconds / 60).toString().padStart(2, '0')
                              const s = (diffSeconds % 60).toString().padStart(2, '0')
                              displayTime = `${m}:${s}`
                              if (diffSeconds <= 60) {
                                textTimeClass = "text-red-400 font-black animate-pulse"
                                rowClass = "border-b border-red-500 bg-[#451a1a] transition-colors leading-tight animate-pulse"
                              } else {
                                textTimeClass = "text-yellow-400 font-black"
                                rowClass = "border-b border-yellow-500 bg-[#423812] transition-colors leading-tight"
                              }
                            }
                          }
                          
                          return (
                            <tr key={i} className={rowClass}>
                              <td className={`py-1 px-1 font-mono w-16 ${textTimeClass}`}>{displayTime}</td>
                              <td className="py-1 px-1 text-center">{item.country === 'US' ? '🇺🇸' : item.country === 'BR' ? '🇧🇷' : item.country}</td>
                              <td className="py-1 px-1 text-gray-300 truncate max-w-[200px]" title={item.title}>{item.title}</td>
                              <td className={`py-1 px-1 ${impactColor}`}>{impactText}</td>
                              <td className="py-1 px-1 text-right text-gray-200">{item.actual !== '-' ? item.actual : ''}</td>
                            </tr>
                          )
                        })}
                        {news.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-600 text-base">Nenhum evento no calendário.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    </div>
                </div>
              </div>

              {/* Preço / Níveis */}
              <div className="col-span-4 bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col min-h-0 overflow-hidden">
                <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                  💰 PREÇO / NÍVEIS
                </div>
                <div className="px-4 py-2.5 flex-1 flex flex-col justify-between min-h-0 overflow-y-auto">
                  <div className="flex flex-col justify-evenly h-full gap-1.5 text-sm xl:text-base font-mono">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-400 tracking-wider text-xs xl:text-sm">JUSTO</span>
                      <span className="text-gray-200 font-bold text-lg xl:text-xl leading-tight">{fairValue?.justo ? formatPts(fairValue.justo) : '---'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-400 tracking-wider text-xs xl:text-sm">JUSTÍSSIMO</span>
                      <span className="text-gray-200 font-bold text-lg xl:text-xl leading-tight">{fairValue?.justissimo ? formatPts(fairValue.justissimo) : '---'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-400 tracking-wider text-xs xl:text-sm">MÁXIMA</span>
                      <span className="text-[#ef4444] font-bold text-lg xl:text-xl leading-tight">{fairValue?.maxima ? formatPts(fairValue.maxima) : '---'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-400 tracking-wider text-xs xl:text-sm">MÍNIMA</span>
                      <span className="text-[#22c55e] font-bold text-lg xl:text-xl leading-tight">{fairValue?.minima ? formatPts(fairValue.minima) : '---'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column (col-span-4) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 min-h-0">
            
            {/* Indicadores Macro */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                📊 INDICADORES MACRO
              </div>
              <div className="p-3 overflow-y-hidden flex-1 flex flex-col justify-center">
                <div className="flex flex-col gap-[2px] text-base font-mono leading-none">
                  {[
                    { label: 'DXY', sym: 'DX-Y.NYB' },
                    { label: 'EUR/USD', sym: 'EURUSD=X' },
                    { label: 'USD/JPY', sym: 'JPY=X' },
                    { label: 'USD/MXN', sym: 'MXN=X' },
                    { label: 'USD/ZAR', sym: 'ZAR=X' },
                    { label: 'USD/TRY', sym: 'TRY=X' },
                    { label: 'USD/BRL', sym: 'BRL=X' },
                    { label: 'S&P', sym: '^GSPC' },
                    { label: 'NASDAQ', sym: '^IXIC' },
                    { label: 'VIX', sym: '^VIX' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-gray-300 w-28">{row.label}</span>
                      <span className="text-gray-200 flex-1 text-right mr-6">
                        {formatPrice(quotes[row.sym]?.price, row.sym === 'DX-Y.NYB' || row.sym === 'EURUSD=X' || row.sym === '^TNX' ? 3 : 2)}
                      </span>
                      <div className="w-28 text-right flex justify-end">
                        <ValChange val={quotes[row.sym]?.changePercent} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Juros / Commodities */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md shrink-0 overflow-hidden flex flex-col">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                📈 JUROS / COMMODITIES
              </div>
              <div className="p-3">
                <div className="flex flex-col gap-1 text-base font-mono leading-none">
                  {[
                    { label: 'UST10Y', sym: '^TNX' },
                    { label: 'DI1', sym: 'NONE' }, // Unavailable
                    { label: 'OIL', sym: 'CL=F' },
                    { label: 'GOLD', sym: 'GC=F' },
                    { label: 'COPPER', sym: 'HG=F' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-gray-300 w-28">{row.label}</span>
                      <div className="w-28 text-right flex justify-end">
                        <ValChange val={quotes[row.sym]?.changePercent} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Bottom Ticker */}
      <div className="mt-3 bg-[#1c1c1c] border-t border-b border-[#333] flex overflow-hidden whitespace-nowrap py-2 shrink-0">
        <div className="animate-[ticker_30s_linear_infinite] flex gap-10 text-base font-mono text-gray-400">
          <span className="flex items-center gap-3">DXY <ValChange val={quotes['DX-Y.NYB']?.changePercent} /></span>
          <span className="flex items-center gap-3">S&P <ValChange val={quotes['^GSPC']?.changePercent} /></span>
          <span className="flex items-center gap-3">NASDAQ <ValChange val={quotes['^IXIC']?.changePercent} /></span>
          <span className="flex items-center gap-3">VIX <ValChange val={quotes['^VIX']?.changePercent} /></span>
          <span className="flex items-center gap-3">WTI OIL <ValChange val={quotes['CL=F']?.changePercent} /></span>
          <span className="flex items-center gap-3">GOLD <ValChange val={quotes['GC=F']?.changePercent} /></span>
          <span className="flex items-center gap-3">COPPER <ValChange val={quotes['HG=F']?.changePercent} /></span>
          <span className="flex items-center gap-3">EUR/USD <ValChange val={quotes['EURUSD=X']?.changePercent} /></span>
          <span className="flex items-center gap-3">USD/BRL <ValChange val={quotes['BRL=X']?.changePercent} /></span>
          
          {/* Duplicate for infinite effect */}
          <span className="flex items-center gap-3">DXY <ValChange val={quotes['DX-Y.NYB']?.changePercent} /></span>
          <span className="flex items-center gap-3">S&P <ValChange val={quotes['^GSPC']?.changePercent} /></span>
          <span className="flex items-center gap-3">NASDAQ <ValChange val={quotes['^IXIC']?.changePercent} /></span>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
      
            {/* Modal Notícia */}
      {(() => {
        if (!activeModalTime) return null;
        const modalEvents = news.filter(n => n.dateIso === activeModalTime)
        if (modalEvents.length === 0) return null;
        
        return (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl w-full max-w-4xl shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-300 max-h-[90vh]">
              
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-6 border-b border-[#333] shrink-0">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm font-mono tracking-widest">EVENTOS AO VIVO • {modalEvents[0]?.time}</span>
                  <h2 className="text-2xl font-bold text-white uppercase">Resultados Simultâneos</h2>
                </div>
                <button onClick={() => setActiveModalTime(null)} className="text-gray-400 hover:text-white bg-[#333] hover:bg-[#444] p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              {/* Corpo Rolável */}
              <div className="flex flex-col gap-6 p-6 overflow-y-auto">
                {modalEvents.map((evt, idx) => (
                  <div key={idx} className="bg-[#2a2a2a] border border-[#444] rounded-lg flex flex-col xl:flex-row items-center justify-between p-3 gap-4">
                    
                    {/* País e Título */}
                    <div className="flex items-center gap-3 flex-1 min-w-[200px] w-full xl:w-auto">
                      <span className="text-2xl">{evt.country === 'US' ? '🇺🇸' : evt.country === 'BR' ? '🇧🇷' : evt.country}</span>
                      <h3 className="text-sm xl:text-base font-bold text-white uppercase line-clamp-2 leading-tight">{evt.title}</h3>
                    </div>
                    
                    {/* Números */}
                    <div className="grid grid-cols-3 gap-2 xl:gap-4 flex-1 w-full xl:w-auto bg-[#1a1a1a] rounded p-2 xl:p-0 xl:bg-transparent">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-gray-500 text-[9px] xl:text-[10px] tracking-widest mb-0.5">ANTERIOR</span>
                        <span className="text-sm xl:text-base font-bold text-gray-300">{evt.previous !== '-' ? evt.previous : '---'}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-x border-[#444]">
                        <span className="text-gray-500 text-[9px] xl:text-[10px] tracking-widest mb-0.5">PROJEÇÃO</span>
                        <span className="text-sm xl:text-base font-bold text-gray-300">{evt.forecast !== '-' ? evt.forecast : '---'}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-blue-400 text-[9px] xl:text-[10px] tracking-widest mb-0.5 font-bold">ATUAL</span>
                        <span className="text-base xl:text-lg font-bold text-white">{evt.actual !== '-' ? evt.actual : '---'}</span>
                      </div>
                    </div>
                    
                    {/* Pressão */}
                    <div className="flex flex-col items-center justify-center bg-[#0f172a] border border-[#1e293b] py-2 px-3 rounded w-full xl:w-[150px] shrink-0">
                      <span className="text-gray-400 text-[8px] tracking-widest mb-1">PRESSÃO DÓLAR</span>
                      {evt.pressure?.direction && evt.pressure.direction !== 'AGUARDANDO' ? (
                        <>
                          <div className={`text-sm xl:text-base font-black leading-none ${
                            evt.pressure.direction === 'ALTA' ? 'text-emerald-500' :
                            evt.pressure.direction === 'BAIXA' ? 'text-red-500' : 'text-yellow-500'
                          }`}>
                            {evt.pressure.direction === 'ALTA' ? 'COMPRA' : evt.pressure.direction === 'BAIXA' ? 'VENDA' : 'NEUTRO'}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center animate-pulse">
                          <div className="text-xs font-bold text-yellow-500">AGUARDANDO</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer do Modal */}
              <div className="p-4 border-t border-[#333] shrink-0">
                <button onClick={() => setActiveModalTime(null)} className="w-full bg-[#444] hover:bg-[#555] text-white py-3 rounded font-bold uppercase tracking-widest transition-colors">
                  FECHAR JANELA
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  )
}
