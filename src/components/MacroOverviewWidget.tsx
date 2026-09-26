'use client'

import { useState, useEffect } from 'react'
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  AlertCircle, 
  Newspaper, 
  Filter,
  ExternalLink,
  ShieldAlert,
  Flame
} from 'lucide-react'

type CalendarEvent = {
  id: string
  time: string
  dateIso: string
  country: string
  currency: string
  title: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  actual: string
  forecast: string
  previous: string
  isCompleted: boolean
  pressure: {
    direction: 'ALTA' | 'BAIXA' | 'NEUTRO' | 'AGUARDANDO'
    explanation: string
  }
}

type NewsArticle = {
  id: string
  title: string
  publisher: string
  link: string
  providerPublishTime: string
}

function USFlag() {
  return (
    <svg className="w-5 h-3.5 rounded-[2px] shadow-sm overflow-hidden inline-block shrink-0" viewBox="0 0 640 480">
      <path fill="#bd3d44" d="M0 0h640v480H0z"/>
      <path stroke="#fff" strokeWidth="37" d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"/>
      <path fill="#192f5d" d="M0 0h285.7v258.5H0z"/>
      <g fill="#fff">
        <g id="s18">
          <g id="s9">
            <g id="s5">
              <polygon id="s" points="0,-13 3.8,-3.9 12.3,-3.9 5.4,1.1 8,9.4 0,4.2 -8,9.4 -5.4,1.1 -12.3,-3.9 -3.8,-3.9"/>
              <use href="#s" x="47.6"/>
              <use href="#s" x="95.2"/>
              <use href="#s" x="142.8"/>
              <use href="#s" x="190.4"/>
            </g>
            <use href="#s5" y="43"/>
          </g>
          <use href="#s9" y="86"/>
        </g>
        <use href="#s18" y="86"/>
        <polygon points="0,-13 3.8,-3.9 12.3,-3.9 5.4,1.1 8,9.4 0,4.2 -8,9.4 -5.4,1.1 -12.3,-3.9 -3.8,-3.9" y="215"/>
        <use href="#s5" x="23.8" y="21.5"/>
        <use href="#s5" x="23.8" y="64.5"/>
        <use href="#s5" x="23.8" y="107.5"/>
        <use href="#s5" x="23.8" y="150.5"/>
        <use href="#s5" x="23.8" y="193.5"/>
      </g>
    </svg>
  )
}

function BRFlag() {
  return (
    <svg className="w-5 h-3.5 rounded-[2px] shadow-sm overflow-hidden inline-block shrink-0" viewBox="0 0 720 504">
      <rect width="720" height="504" fill="#009c3b"/>
      <polygon points="360,36 684,252 360,468 36,252" fill="#ffdf00"/>
      <circle cx="360" cy="252" r="126" fill="#002776"/>
      <path d="M 234 252 A 150 150 0 0 1 486 230" fill="none" stroke="#ffffff" strokeWidth="12"/>
    </svg>
  )
}

export function MacroOverviewWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [fairValue, setFairValue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'US' | 'BR'>('ALL')
  const [activeTab, setActiveTab] = useState<'IMPACT_EVENTS' | 'MARKET_NEWS'>('IMPACT_EVENTS')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [calRes, fairRes, newsRes] = await Promise.all([
          fetch('/api/calendar'),
          fetch('/api/fair-value'),
          fetch('/api/macro-news')
        ])

        if (isMounted) {
          if (calRes.ok) {
            const calData = await calRes.json()
            setEvents(calData.events || [])
          }
          if (fairRes.ok) {
            const fairData = await fairRes.json()
            setFairValue(fairData)
          }
          if (newsRes.ok) {
            const newsData = await newsRes.json()
            setArticles(newsData.articles || [])
          }
        }
      } catch (e) {
        console.error('Macro Overview Error:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const filteredEvents = events.filter((e) => {
    if (countryFilter === 'US') return e.country === 'US'
    if (countryFilter === 'BR') return e.country === 'BR'
    return true
  })

  // Estatísticas de notícias de alto impacto
  const highImpactCount = events.filter(e => e.impact === 'HIGH').length
  const bullishCount = events.filter(e => e.pressure?.direction === 'ALTA').length
  const bearishCount = events.filter(e => e.pressure?.direction === 'BAIXA').length

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 h-32 animate-pulse flex items-center justify-center">
          <span className="text-slate-500 text-sm">Carregando central de inteligência macroeconômica...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Cards de Destaque no Topo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
        {/* Card 1: Preço Justo */}
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Preço Justo (Base)</span>
            <span className="text-xs font-mono text-blue-400">WDO</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-mono font-black text-slate-100">
              {fairValue?.justo ? fairValue.justo.toFixed(1) : '-'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">PTAX Anterior + Juros Carry</p>
          </div>
        </div>

        {/* Card 2: Preço Justíssimo */}
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Preço Justíssimo (Macro)</span>
            <span className="text-xs font-mono text-emerald-400">Abertura</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-mono font-black text-emerald-400">
              {fairValue?.justissimo ? fairValue.justissimo.toFixed(1) : '-'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Ajustado pelo Viés Noturno</p>
          </div>
        </div>

        {/* Card 3: Notícias de Alto Impacto */}
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Eventos de Alto Impacto</span>
            <Flame size={16} className="text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-black text-red-400">{highImpactCount}</span>
            <span className="text-xs text-slate-400">notícias com volatilidade hoje</span>
          </div>
        </div>

        {/* Card 4: Saldo das Pressões do Dia */}
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Saldo de Pressão no WDO</span>
            <ShieldAlert size={16} className="text-amber-400" />
          </div>
          <div className="mt-3 flex items-center gap-3 font-mono text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              🟢 Alta: {bullishCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              🔴 Baixa: {bearishCount}
            </span>
          </div>
        </div>
      </div>

      {/* Painel Principal de Notícias & Indicadores */}
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex flex-col gap-6">
        {/* Header com Navegação por Abas e Filtro por País */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          {/* Abas */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('IMPACT_EVENTS')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'IMPACT_EVENTS'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'bg-[#0b1120] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
              }`}
            >
              <Globe size={14} /> Notícias & Indicadores com Pressão WDO
            </button>
            <button
              onClick={() => setActiveTab('MARKET_NEWS')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'MARKET_NEWS'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'bg-[#0b1120] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
              }`}
            >
              <Newspaper size={14} /> Manchetes Financeiras de Última Hora
            </button>
          </div>

          {/* Filtro por País */}
          {activeTab === 'IMPACT_EVENTS' && (
            <div className="flex bg-[#0b1120] rounded-xl border border-[#1e293b] p-1 gap-1">
              <button
                onClick={() => setCountryFilter('ALL')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  countryFilter === 'ALL'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setCountryFilter('US')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  countryFilter === 'US'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <USFlag /> EUA
              </button>
              <button
                onClick={() => setCountryFilter('BR')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  countryFilter === 'BR'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BRFlag /> Brasil
              </button>
            </div>
          )}
        </div>

        {/* ABA 1: Notícias & Indicadores com Estudo Direcional */}
        {activeTab === 'IMPACT_EVENTS' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3">
              {filteredEvents.map((e) => (
                <div
                  key={e.id}
                  className="bg-[#0b1120] rounded-xl border border-[#1e293b] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  {/* Esquerda: Horário + País + Título + Impacto */}
                  <div className="flex items-start md:items-center gap-3">
                    <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-300 bg-[#0f172a] px-2.5 py-1 rounded-lg border border-[#1e293b] shrink-0">
                      <Clock size={12} className="text-slate-400" />
                      <span>{e.time}</span>
                    </div>

                    <div className="shrink-0">
                      {e.country === 'US' ? <USFlag /> : <BRFlag />}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100">{e.title}</h4>
                        {e.impact === 'HIGH' && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                            🔴 ALTO IMPACTO
                          </span>
                        )}
                        {e.impact === 'MEDIUM' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            🟡 MÉDIO IMPACTO
                          </span>
                        )}
                      </div>

                      {/* Estudo Direcional de Pressão */}
                      {e.pressure?.explanation && (
                        <p className="text-xs text-slate-400 mt-1 italic">
                          💡 <strong className="text-slate-300">Estudo Macro:</strong> "{e.pressure.explanation}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Direita: Dados de Mercado + Pressão Direcional WDO */}
                  <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 border-[#1e293b] pt-3 md:pt-0 shrink-0">
                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                      <div>Proj: <strong className="text-slate-200">{e.forecast}</strong></div>
                      <div>Prev: <strong className="text-slate-200">{e.previous}</strong></div>
                      {e.actual !== '-' && (
                        <div className="text-emerald-400 font-bold">Atual: {e.actual}</div>
                      )}
                    </div>

                    {/* Badge de Pressão no WDO */}
                    <div className="shrink-0">
                      {e.pressure?.direction === 'ALTA' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold text-xs shadow-sm">
                          <TrendingUp size={14} /> ALTA (WDO)
                        </span>
                      )}
                      {e.pressure?.direction === 'BAIXA' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 font-extrabold text-xs shadow-sm">
                          <TrendingDown size={14} /> BAIXA (WDO)
                        </span>
                      )}
                      {e.pressure?.direction === 'NEUTRO' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/30 font-medium text-xs">
                          <Minus size={14} /> NEUTRO
                        </span>
                      )}
                      {e.pressure?.direction === 'AGUARDANDO' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400/80 border border-blue-500/20 text-xs">
                          <Clock size={12} /> Aguardando
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredEvents.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs italic bg-[#0b1120] rounded-xl border border-[#1e293b]">
                  Nenhuma notícia cadastrada para este filtro no momento.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 2: Manchetes Financeiras de Última Hora */}
        {activeTab === 'MARKET_NEWS' && (
          <div className="grid grid-cols-1 gap-3">
            {articles.map((art) => (
              <a
                key={art.id}
                href={art.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0b1120] rounded-xl border border-[#1e293b] p-4 flex items-center justify-between gap-4 hover:border-blue-500/40 hover:bg-[#1e293b]/20 transition-all group"
              >
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {art.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{art.publisher}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(art.providerPublishTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-[#0f172a] rounded-lg border border-[#1e293b] text-slate-400 group-hover:text-blue-400 transition-colors shrink-0">
                  <ExternalLink size={16} />
                </div>
              </a>
            ))}

            {articles.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs italic bg-[#0b1120] rounded-xl border border-[#1e293b]">
                Nenhuma manchete financeira encontrada no momento.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
