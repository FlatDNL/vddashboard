'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, Bell, CheckCircle2 } from 'lucide-react'

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
    direction: string
    explanation: string
  }
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

export function NextEventAlertWidget({ compact = false }: { compact?: boolean }) {
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null)
  const [timeRemainingSec, setTimeRemainingSec] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchNextEvent() {
      try {
        const res = await fetch('/api/calendar')
        if (res.ok && isMounted) {
          const json = await res.json()
          const events: CalendarEvent[] = json.events || []
          
          const nowMs = Date.now()
          
          // Mantém a notícia visível por até 2 minutos (120.000 ms) APÓS a divulgação
          const upcoming = events.filter((e) => {
            const eventMs = new Date(e.dateIso).getTime()
            return eventMs > nowMs - 120000 
          })

          if (upcoming.length > 0) {
            setNextEvent(upcoming[0])
          } else {
            setNextEvent(null)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchNextEvent()
    const interval = setInterval(fetchNextEvent, 15000) // Atualiza a cada 15s para pegar resultado rápido
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Timer de contagem regressiva a cada segundo
  useEffect(() => {
    if (!nextEvent) {
      setTimeRemainingSec(null)
      return
    }

    const updateTimer = () => {
      const nowMs = Date.now()
      const eventMs = new Date(nextEvent.dateIso).getTime()
      const diffSec = Math.floor((eventMs - nowMs) / 1000)
      setTimeRemainingSec(diffSec)
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)
    return () => clearInterval(timerInterval)
  }, [nextEvent])

  if (loading) {
    if (compact) {
      return (
        <div className="h-9 px-3 bg-[#0f172a] rounded-full border border-[#1e293b] animate-pulse flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Buscando notícias...</span>
        </div>
      )
    }
    return (
      <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-4 w-full h-16 animate-pulse flex items-center justify-between">
        <span className="text-xs text-slate-500">Buscando próxima notícia do mercado...</span>
      </div>
    )
  }

  // Lógica de alerta por tempo:
  // <= 0s e >= -120s: LIBERADO HÁ POUCO (VERDE EMERALD - MANTÉM POR 2 MINUTOS)
  // <= 60s (1 min): VERMELHO
  // <= 300s (5 min): AMARELO
  // > 300s: PADRÃO (Escuro / Slate)
  const isJustReleased = timeRemainingSec !== null && timeRemainingSec <= 0 && timeRemainingSec >= -120
  const isRedAlert = timeRemainingSec !== null && timeRemainingSec > 0 && timeRemainingSec <= 60
  const isYellowAlert = timeRemainingSec !== null && timeRemainingSec > 60 && timeRemainingSec <= 300

  // Formatador de tempo regressivo (MM:SS ou HH:MM:SS)
  const formatCountdown = (sec: number) => {
    if (sec <= 0 && sec >= -120) {
      const elapsed = Math.abs(sec)
      return `LIBERADO (${elapsed}s atrás)`
    }
    if (sec < -120) return 'CONCLUÍDO'
    
    const hours = Math.floor(sec / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = sec % 60

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Modo COMPACTO (Para o Header / Barra Superior)
  if (compact) {
    if (!nextEvent || timeRemainingSec === null) {
      return (
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f172a] border border-[#1e293b] text-xs text-slate-400">
          <Bell size={13} className="text-blue-400" />
          <span className="text-[11px]">Sem eventos econômicos nas próximas horas</span>
        </div>
      )
    }

    return (
      <div
        className={`flex items-center gap-3 px-3.5 py-1.5 rounded-full border text-xs transition-all duration-500 shadow-sm ${
          isJustReleased
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse font-bold'
            : isRedAlert
            ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse font-bold'
            : isYellowAlert
            ? 'bg-amber-950/80 border-amber-500 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-semibold'
            : 'bg-[#0f172a] border-[#1e293b] text-slate-200'
        }`}
      >
        {isJustReleased ? (
          <CheckCircle2 size={14} className="text-emerald-400 animate-bounce" />
        ) : isRedAlert || isYellowAlert ? (
          <AlertTriangle size={14} className={isRedAlert ? 'text-red-400 animate-bounce' : 'text-amber-400'} />
        ) : (
          <Clock size={14} className="text-blue-400" />
        )}

        {/* Bandeira + Título do Evento */}
        <div className="flex items-center gap-1.5">
          {nextEvent.country === 'US' ? <USFlag /> : <BRFlag />}
          <span className="font-bold text-slate-100 text-[11px] truncate max-w-[160px] lg:max-w-[240px]">
            {nextEvent.title}
          </span>
        </div>

        {/* Nível de Impacto */}
        <div className="hidden sm:flex items-center">
          {nextEvent.impact === 'HIGH' ? (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              🔴 ALTO
            </span>
          ) : (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              🟡 MÉDIO
            </span>
          )}
        </div>

        {/* Se foi liberado há pouco, destaca o valor Atual publicado */}
        {isJustReleased && nextEvent.actual !== '-' ? (
          <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded font-mono text-[11px] text-emerald-300 font-extrabold">
            <span>Atual: {nextEvent.actual}</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-400 border-l border-white/10 pl-2">
            <span>Proj: <strong className="text-slate-200">{nextEvent.forecast}</strong></span>
            <span>Prev: <strong className="text-slate-200">{nextEvent.previous}</strong></span>
          </div>
        )}

        {/* Horário da Notícia */}
        <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-slate-400 border-l border-white/10 pl-2">
          <span>Horário: <strong className="text-slate-200">{nextEvent.time}</strong></span>
        </div>

        {/* Contagem Regressiva ou Status de Liberação */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            {isJustReleased ? 'STATUS:' : isRedAlert ? '1 MIN!' : isYellowAlert ? '5 MIN!' : 'EM:'}
          </span>
          <span className={`font-mono font-bold text-xs ${
            isJustReleased ? 'text-emerald-300' : isRedAlert ? 'text-red-300' : isYellowAlert ? 'text-amber-300' : 'text-blue-400'
          }`}>
            {formatCountdown(timeRemainingSec)}
          </span>
        </div>
      </div>
    )
  }

  // Modo PADRÃO
  if (!nextEvent || timeRemainingSec === null) {
    return (
      <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] px-4 py-3 w-full flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-blue-400" />
          <span>Sem eventos econômicos agendados para as próximas horas</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Mercado Calmo</span>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border p-4 w-full flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500 relative overflow-hidden ${
        isJustReleased
          ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse'
          : isRedAlert
          ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-pulse'
          : isYellowAlert
          ? 'bg-amber-950/80 border-amber-500 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
          : 'bg-[#0f172a] border-[#1e293b] text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            isJustReleased
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : isRedAlert
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : isYellowAlert
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}
        >
          {isJustReleased ? <CheckCircle2 size={18} /> : isRedAlert || isYellowAlert ? <AlertTriangle size={18} /> : <Clock size={18} />}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider ${
                isJustReleased
                  ? 'bg-emerald-500 text-black font-black'
                  : isRedAlert
                  ? 'bg-red-500 text-white animate-bounce'
                  : isYellowAlert
                  ? 'bg-amber-500 text-black font-black'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {isJustReleased
                ? '✨ DADO LIBERADO!'
                : isRedAlert
                ? '⚠️ ATENÇÃO: EM 1 MINUTO!'
                : isYellowAlert
                ? '⚡ ALERTA: EM 5 MINUTOS!'
                : 'PRÓXIMO EVENTO'}
            </span>

            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0b1120]/80 border border-white/10 text-slate-200">
              {nextEvent.country === 'US' ? <USFlag /> : <BRFlag />}
              <span className="text-[10px] font-bold">{nextEvent.country === 'US' ? 'EUA' : 'BRASIL'}</span>
            </div>
          </div>

          <h3 className="text-sm font-bold mt-1 text-slate-100 flex items-center gap-2">
            {nextEvent.title}
          </h3>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
        <div className="text-left sm:text-right hidden md:block">
          <div className="text-[10px] text-slate-400 font-mono">Projeção: <span className="font-bold text-slate-200">{nextEvent.forecast}</span></div>
          <div className="text-[10px] text-slate-400 font-mono">Anterior: <span className="font-bold text-slate-200">{nextEvent.previous}</span></div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            {timeRemainingSec <= 0 ? 'Status' : 'Tempo Restante'}
          </span>
          <span
            className={`text-lg sm:text-xl font-mono font-black tracking-wider ${
              isJustReleased ? 'text-emerald-300' : isRedAlert ? 'text-white' : isYellowAlert ? 'text-amber-300' : 'text-blue-400'
            }`}
          >
            {formatCountdown(timeRemainingSec)}
          </span>
        </div>
      </div>
    </div>
  )
}
