'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Maximize, Minimize } from 'lucide-react'

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
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const [quotesRes, fvRes, riskRes, calendarRes, aggRes] = await Promise.all([
          fetch(`/api/quotes?symbols=${SYMBOLS.join(',')}`),
          fetch('/api/fair-value'),
          fetch('/api/risk'),
          fetch('/api/calendar'),
          fetch('/api/aggression-balance')
        ])

        const [quotesData, fvData, riskData, calendarData, aggData] = await Promise.all([
          quotesRes.json().catch(() => ({})),
          fvRes.json().catch(() => null),
          riskRes.json().catch(() => null),
          calendarRes.json().catch(() => ({ events: [] })),
          aggRes.json().catch(() => ({ groups: [], records: [] }))
        ])

        if (!isMounted) return

        setQuotes(quotesData)
        setFairValue(fvData)
        setRisk(riskData)
        
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
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

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

            {/* Participantes */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md shrink-0 overflow-hidden flex flex-col">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center">
                PARTICIPANTES
              </div>
              <div className="p-5 pt-4">
                <div className="grid grid-cols-3 text-center">
                  {aggression.length > 0 ? aggression.map((g, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-base text-gray-300 mb-2">{g.name}</span>
                      <span className={`text-4xl font-bold tracking-tight ${g.value > 0 ? 'text-[#22c55e]' : g.value < 0 ? 'text-[#ef4444]' : 'text-gray-500'}`}>
                        {g.value > 0 ? '+' : ''}{g.value.toLocaleString('pt-BR')} {g.value > 0 ? '↑' : g.value < 0 ? '↓' : ''}
                      </span>
                    </div>
                  )) : (
                    <>
                      <div className="flex flex-col"><span className="text-base text-gray-300 mb-2">ESTRANGEIROS</span><span className="text-gray-500 text-4xl font-bold">---</span></div>
                      <div className="flex flex-col"><span className="text-base text-gray-300 mb-2">BANCOS</span><span className="text-gray-500 text-4xl font-bold">---</span></div>
                      <div className="flex flex-col"><span className="text-base text-gray-300 mb-2">VAREJO</span><span className="text-gray-500 text-4xl font-bold">---</span></div>
                    </>
                  )}
                </div>
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
                          return (
                            <tr key={i} className="border-b border-[#222] hover:bg-[#333] transition-colors leading-tight">
                              <td className="py-1 px-1 text-gray-400">{item.time}</td>
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
              <div className="col-span-4 bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col justify-center overflow-hidden">
                <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                  💰 PREÇO / NÍVEIS
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center">
                  <div className="flex flex-col gap-5 text-base font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 tracking-widest">JUSTO</span>
                      <span className="text-gray-200 font-bold text-2xl">{fairValue?.justo ? formatPts(fairValue.justo) : '---'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 tracking-widest">JUSTÍSSIMO</span>
                      <span className="text-gray-200 font-bold text-2xl">{fairValue?.justissimo ? formatPts(fairValue.justissimo) : '---'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 tracking-widest">MÁXIMA</span>
                      <span className="text-[#ef4444] font-bold text-2xl">{fairValue?.maxima ? formatPts(fairValue.maxima) : '---'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 tracking-widest">MÍNIMA</span>
                      <span className="text-[#22c55e] font-bold text-2xl">{fairValue?.minima ? formatPts(fairValue.minima) : '---'}</span>
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
    </div>
  )
}
