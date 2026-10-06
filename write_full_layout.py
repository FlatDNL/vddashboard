import json

file_content = """'use client'

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
        setNews(eventsList.slice(0, 8)) // Top 8 events

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
      <div className="flex h-screen bg-[#111111] items-center justify-center text-gray-500 font-mono text-sm">
        LOADING TERMINAL...
      </div>
    )
  }

  // Helpers components for UI
  const ValChange = ({ val }: { val: number | undefined }) => {
    if (val === undefined) return <span className="text-gray-500">---</span>
    const color = val > 0 ? 'text-[#22c55e]' : val < 0 ? 'text-[#ef4444]' : 'text-gray-400'
    const icon = val > 0 ? '↗' : val < 0 ? '↘' : ''
    return (
      <span className={`inline-flex items-center gap-1 whitespace-nowrap ${color} font-mono text-sm`}>
        {formatPct(val)} {icon}
      </span>
    )
  }

  const RiskBar = ({ score, status }: { score: number, status: string }) => {
    const pct = Math.max(0, Math.min(100, (score + 100) / 2))
    const isRiskOn = status === 'RISK ON' || score > 0
    const color = isRiskOn ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
    return (
      <div className="flex items-center mt-1 w-full text-xs font-mono text-gray-400">
        <span className="w-20">DÓLAR {isRiskOn ? '↓' : '↑'}</span>
        <span className="mr-2">FORÇA</span>
        <div className="flex-1 h-3 flex gap-[2px]">
          {Array.from({ length: 10 }).map((_, i) => (
             <div key={i} className={`h-full flex-1 ${i < (pct / 10) ? color : 'bg-[#333]'}`} />
          ))}
        </div>
        <span className="ml-2 w-10 text-right">{pct.toFixed(0)}%</span>
      </div>
    )
  }

  const wdoScore = risk?.wdo?.score || 0
  const globalScore = risk?.global?.score || 0
  const brazilScore = risk?.brazil?.score || 0

  return (
    <div ref={containerRef} className="min-h-screen bg-[#121212] text-[#e2e8f0] p-3 font-mono uppercase selection:bg-gray-700 relative group">
      
      {/* Botão de Tela Cheia (Aparece no Hover) */}
      <div className="absolute top-2 left-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-gray-300 px-3 py-1.5 rounded border border-[#444] transition-all shadow-xl"
          title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          <span className="text-sm font-semibold">{isFullscreen ? 'SAIR' : 'TELA CHEIA'}</span>
        </button>
      </div>

      {/* Top Bar */}
      <div className="flex flex-col items-center pb-3 mb-2">
        <h1 className="text-2xl font-sans tracking-wide text-gray-200">MACRO DÓLAR — WDO</h1>
        <div className="text-sm text-gray-500 tracking-wider mt-1 font-sans">
          Tendência | Risco | Fluxo | Notícias | Contexto
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        
        {/* Left Column (col-span-8) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
          
          {/* Top Row: Risco Global / Risco Brasil */}
          <div className="grid grid-cols-2 gap-3">
            {/* Risco Global */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md">
              <div className="text-sm text-gray-400 mb-2 font-bold flex items-center">
                🌍 RISCO GLOBAL
              </div>
              <div className="flex items-baseline gap-4 mb-2">
                <span className={`text-xl font-bold ${globalScore > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {risk?.global?.status || 'NEUTRO'} {globalScore > 0 ? '+' : ''}{globalScore.toFixed(0)}
                </span>
                <div className="flex gap-4 text-sm font-mono">
                   <div className="flex gap-1 items-center">
                     <span className="text-gray-300">S&P</span>
                     <ValChange val={quotes['^GSPC']?.changePercent} />
                   </div>
                   <div className="flex gap-1 items-center">
                     <span className="text-gray-300">DXY</span>
                     <ValChange val={quotes['DX-Y.NYB']?.changePercent} />
                   </div>
                   <div className="flex gap-1 items-center">
                     <span className="text-gray-300">UST10Y</span>
                     <ValChange val={quotes['^TNX']?.changePercent} />
                   </div>
                </div>
              </div>
              <div className="border-t border-[#333] w-full mb-2"></div>
              <div className="text-xs text-gray-500">IMPACTO NO DÓLAR</div>
              <RiskBar score={globalScore} status={risk?.global?.status} />
            </div>

            {/* Risco Brasil */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md">
              <div className="text-sm text-gray-400 mb-2 font-bold flex items-center">
                🇧🇷 RISCO BRASIL
              </div>
              <div className="flex items-baseline gap-4 mb-2">
                <span className={`text-xl font-bold ${brazilScore > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {risk?.brazil?.status || 'NEUTRO'} {brazilScore > 0 ? '+' : ''}{brazilScore.toFixed(0)}
                </span>
                <div className="flex gap-4 text-sm font-mono">
                   <div className="flex gap-1 items-center">
                     <span className="text-gray-300">IBOV</span>
                     <ValChange val={quotes['^BVSP']?.changePercent} />
                   </div>
                   <div className="flex gap-1 items-center">
                     <span className="text-gray-300">EWZ</span>
                     <ValChange val={quotes['EWZ']?.changePercent} />
                   </div>
                   <div className="flex gap-1 items-center">
                     <span className="text-gray-300">DI</span>
                     <ValChange val={undefined} />
                   </div>
                </div>
              </div>
              <div className="border-t border-[#333] w-full mb-2"></div>
              <div className="text-xs text-gray-500">IMPACTO NO DÓLAR</div>
              <RiskBar score={brazilScore} status={risk?.brazil?.status} />
            </div>
          </div>

          {/* Dólar and Participantes */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-sm text-gray-400 mb-1 font-bold">💵 DÓLAR</div>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-white tracking-tighter">
                    {fairValue?.atual ? (fairValue.atual / 1000).toFixed(4) : '---'}
                  </span>
                  <div className="text-xl">
                    <ValChange val={quotes['BRL=X']?.changePercent} />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-8 text-sm font-mono text-right mt-1">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">JUSTO</span>
                  <span className="text-gray-200">{fairValue?.justo ? formatPts(fairValue.justo) : '---'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">JUSTÍSSIMO</span>
                  <span className="text-gray-200">{fairValue?.justissimo ? formatPts(fairValue.justissimo) : '---'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">MÁXIMA</span>
                  <span className="text-gray-200">{fairValue?.maxima ? formatPts(fairValue.maxima) : '---'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">MÍNIMA</span>
                  <span className="text-gray-200">{fairValue?.minima ? formatPts(fairValue.minima) : '---'}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-[#333] pt-3">
              <div className="text-xs text-gray-400 mb-3">PARTICIPANTES</div>
              <div className="grid grid-cols-3 text-center">
                {aggression.length > 0 ? aggression.map((g, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-sm text-gray-300">{g.name}</span>
                    <span className={`text-lg font-bold tracking-tight ${g.value > 0 ? 'text-[#22c55e]' : g.value < 0 ? 'text-[#ef4444]' : 'text-gray-500'}`}>
                      {g.value > 0 ? '+' : ''}{g.value.toLocaleString('pt-BR')} {g.value > 0 ? '↑' : g.value < 0 ? '↓' : ''}
                    </span>
                  </div>
                )) : (
                  <>
                    <div className="flex flex-col"><span className="text-sm text-gray-300">ESTRANGEIROS</span><span className="text-gray-500 text-lg font-bold">---</span></div>
                    <div className="flex flex-col"><span className="text-sm text-gray-300">BANCOS</span><span className="text-gray-500 text-lg font-bold">---</span></div>
                    <div className="flex flex-col"><span className="text-sm text-gray-300">VAREJO</span><span className="text-gray-500 text-lg font-bold">---</span></div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Eventos */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex-1">
            <div className="text-sm text-gray-400 mb-3 font-bold">
               📄 EVENTOS DO CALENDÁRIO
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead>
                  <tr className="text-gray-500 border-b border-[#333]">
                    <th className="py-2 px-1 font-normal">HORA</th>
                    <th className="py-2 px-1 font-normal">PAÍS</th>
                    <th className="py-2 px-1 font-normal">EVENTO</th>
                    <th className="py-2 px-1 font-normal">IMPACTO</th>
                    <th className="py-2 px-1 font-normal text-center">WDO</th>
                    <th className="py-2 px-1 font-normal text-right">ATUAL</th>
                    <th className="py-2 px-1 font-normal text-right">PROJ.</th>
                    <th className="py-2 px-1 font-normal text-right">ANT.</th>
                  </tr>
                </thead>
                <tbody>
                  {news.map((item, i) => {
                    const isHigh = item.impact === 'HIGH'
                    const isMed = item.impact === 'MEDIUM'
                    const impactText = isHigh ? 'ALTO' : isMed ? 'MÉDIO' : 'BAIXO'
                    const impactColor = isHigh ? 'text-[#ef4444]' : isMed ? 'text-yellow-400' : 'text-[#22c55e]'
                    
                    const press = item.pressure?.direction
                    const pressText = press === 'ALTA' ? '↑ ALTA' : press === 'BAIXA' ? '↓ BAIXA' : 'NEUTRO'
                    const pressColor = press === 'ALTA' ? 'text-[#22c55e]' : press === 'BAIXA' ? 'text-[#ef4444]' : 'text-gray-500'

                    return (
                      <tr key={i} className="border-b border-[#222] hover:bg-[#333] transition-colors">
                        <td className="py-2 px-1 text-gray-400">{item.time}</td>
                        <td className="py-2 px-1 text-center">{item.country === 'US' ? '🇺🇸' : item.country === 'BR' ? '🇧🇷' : item.country}</td>
                        <td className="py-2 px-1 text-gray-300 truncate max-w-[200px]" title={item.title}>{item.title}</td>
                        <td className={`py-2 px-1 ${impactColor}`}>{impactText}</td>
                        <td className={`py-2 px-1 text-center ${pressColor}`}>{pressText}</td>
                        <td className="py-2 px-1 text-right text-gray-200">{item.actual !== '-' ? item.actual : ''}</td>
                        <td className="py-2 px-1 text-right text-gray-500">{item.forecast !== '-' ? item.forecast : ''}</td>
                        <td className="py-2 px-1 text-right text-gray-500">{item.previous !== '-' ? item.previous : ''}</td>
                      </tr>
                    )
                  })}
                  {news.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-gray-600">Nenhum evento no calendário.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (col-span-4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          
          {/* Indicadores Macro */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex-1">
            <div className="text-sm text-gray-400 mb-3 font-bold">
              📊 INDICADORES MACRO
            </div>
            <div className="flex flex-col gap-1 text-sm font-mono">
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
                  <span className="text-gray-300 w-24">{row.label}</span>
                  <span className="text-gray-200 flex-1 text-right mr-4">
                    {formatPrice(quotes[row.sym]?.price, row.sym === 'DX-Y.NYB' || row.sym === 'EURUSD=X' || row.sym === '^TNX' ? 3 : 2)}
                  </span>
                  <div className="w-24 text-right flex justify-end">
                    <ValChange val={quotes[row.sym]?.changePercent} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Juros / Commodities */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md">
            <div className="text-sm text-gray-400 mb-3 font-bold">
              📈 JUROS / COMMODITIES
            </div>
            <div className="flex flex-col gap-1 text-sm font-mono">
              {[
                { label: 'UST10Y', sym: '^TNX' },
                { label: 'DI1', sym: 'NONE' }, // Unavailable
                { label: 'OIL', sym: 'CL=F' },
                { label: 'GOLD', sym: 'GC=F' },
                { label: 'COPPER', sym: 'HG=F' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-300 w-24">{row.label}</span>
                  <div className="w-24 text-right flex justify-end">
                    <ValChange val={quotes[row.sym]?.changePercent} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Bottom Ticker */}
      <div className="mt-4 bg-[#1c1c1c] border-t border-b border-[#333] flex overflow-hidden whitespace-nowrap py-1.5">
        <div className="animate-[ticker_30s_linear_infinite] flex gap-8 text-sm font-mono text-gray-400">
          <span className="flex items-center gap-2">DXY <ValChange val={quotes['DX-Y.NYB']?.changePercent} /></span>
          <span className="flex items-center gap-2">S&P <ValChange val={quotes['^GSPC']?.changePercent} /></span>
          <span className="flex items-center gap-2">NASDAQ <ValChange val={quotes['^IXIC']?.changePercent} /></span>
          <span className="flex items-center gap-2">VIX <ValChange val={quotes['^VIX']?.changePercent} /></span>
          <span className="flex items-center gap-2">WTI OIL <ValChange val={quotes['CL=F']?.changePercent} /></span>
          <span className="flex items-center gap-2">GOLD <ValChange val={quotes['GC=F']?.changePercent} /></span>
          <span className="flex items-center gap-2">COPPER <ValChange val={quotes['HG=F']?.changePercent} /></span>
          <span className="flex items-center gap-2">EUR/USD <ValChange val={quotes['EURUSD=X']?.changePercent} /></span>
          <span className="flex items-center gap-2">USD/BRL <ValChange val={quotes['BRL=X']?.changePercent} /></span>
          
          {/* Duplicate for infinite effect */}
          <span className="flex items-center gap-2">DXY <ValChange val={quotes['DX-Y.NYB']?.changePercent} /></span>
          <span className="flex items-center gap-2">S&P <ValChange val={quotes['^GSPC']?.changePercent} /></span>
          <span className="flex items-center gap-2">NASDAQ <ValChange val={quotes['^IXIC']?.changePercent} /></span>
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
"""

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(file_content)
