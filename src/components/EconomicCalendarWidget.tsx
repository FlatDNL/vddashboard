'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'

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
}

type CalendarResponse = {
  targetDate: string
  isUpcomingBusinessDay: boolean
  events: CalendarEvent[]
}

export function EconomicCalendarWidget() {
  const [data, setData] = useState<CalendarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH_MEDIUM' | 'HIGH'>('ALL')

  useEffect(() => {
    let isMounted = true

    async function fetchCalendar() {
      try {
        const res = await fetch('/api/calendar')
        if (res.ok && isMounted) {
          const json = await res.json()
          setData(json)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchCalendar()
    const interval = setInterval(fetchCalendar, 60000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  if (loading || !data) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 w-full flex items-center justify-center h-48 animate-pulse">
        <span className="text-slate-500 text-sm">Carregando calendário econômico...</span>
      </div>
    )
  }

  const filteredEvents = data.events.filter((e) => {
    if (impactFilter === 'HIGH') return e.impact === 'HIGH'
    if (impactFilter === 'HIGH_MEDIUM') return e.impact === 'HIGH' || e.impact === 'MEDIUM'
    return true
  })

  const formatDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 w-full flex flex-col gap-5">
      {/* Header do Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <CalendarIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">Calendário Econômico</h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#1e293b] text-slate-400 font-mono">
                {formatDateLabel(data.targetDate)}
              </span>
              {data.isUpcomingBusinessDay && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Próximo dia útil
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Notícias e indicadores que movimentam o Dólar (USD/BRL)
            </p>
          </div>
        </div>

        {/* Filtros de Impacto */}
        <div className="flex bg-[#0b1120] rounded-xl border border-[#1e293b] p-1 gap-1 self-start sm:self-auto">
          <button
            onClick={() => setImpactFilter('ALL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              impactFilter === 'ALL'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setImpactFilter('HIGH_MEDIUM')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              impactFilter === 'HIGH_MEDIUM'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Médio & Alto
          </button>
          <button
            onClick={() => setImpactFilter('HIGH')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              impactFilter === 'HIGH'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔴 Alto Impacto
          </button>
        </div>
      </div>

      {/* Tabela de Eventos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-slate-400 uppercase text-[10px] tracking-wider">
              <th className="py-3 px-3">Horário</th>
              <th className="py-3 px-3">País</th>
              <th className="py-3 px-3">Evento / Indicador</th>
              <th className="py-3 px-3">Impacto</th>
              <th className="py-3 px-3 text-right">Atual</th>
              <th className="py-3 px-3 text-right">Projeção</th>
              <th className="py-3 px-3 text-right">Anterior</th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {filteredEvents.map((e) => (
              <tr key={e.id} className="hover:bg-[#1e293b]/30 transition-colors">
                {/* Horário */}
                <td className="py-3 px-3 font-mono text-slate-300 font-semibold whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-500" />
                    {e.time}
                  </div>
                </td>

                {/* País */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0b1120] border border-[#1e293b] font-medium text-slate-300">
                    {e.country === 'US' ? '🇺🇸 USD' : '🇧🇷 BRL'}
                  </span>
                </td>

                {/* Evento */}
                <td className="py-3 px-3 font-medium text-slate-200">
                  {e.title}
                </td>

                {/* Impacto */}
                <td className="py-3 px-3 whitespace-nowrap">
                  {e.impact === 'HIGH' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      ALTO
                    </span>
                  )}
                  {e.impact === 'MEDIUM' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      MÉDIO
                    </span>
                  )}
                  {e.impact === 'LOW' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px]">
                      BAIXO
                    </span>
                  )}
                </td>

                {/* Atual */}
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                  {e.actual !== '-' ? (
                    <span className="text-emerald-400">{e.actual}</span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>

                {/* Projeção */}
                <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                  {e.forecast}
                </td>

                {/* Anterior */}
                <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                  {e.previous}
                </td>

                {/* Status */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  {e.isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                      <CheckCircle2 size={10} /> Concluído
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20">
                      Aguardando
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 text-xs italic">
                  Nenhum evento econômico encontrado para este filtro de impacto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
