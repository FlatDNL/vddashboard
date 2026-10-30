'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Radio,
  Target,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Minus
} from 'lucide-react'

export interface FluxoIAData {
  online?: boolean
  updatedAt?: number
  updatedAtStr?: string
  ativo?: string
  preco_atual?: number
  bid?: number
  ask?: number
  vwap?: number
  dist_pts?: number
  dist_abs?: number
  z_score?: number
  delta_10s?: number
  delta_30s?: number
  em_janela?: boolean
  em_cooldown?: boolean
  cooldown_restante_seg?: number
  estado?: 'NEUTRO' | 'PREPARAR_COMPRA' | 'PREPARAR_VENDA' | 'COMPRA' | 'VENDA' | 'EM_OPERACAO' | 'COOLDOWN' | 'OFFLINE'
  sinal?: {
    tipo: 'COMPRA' | 'VENDA'
    entrada: number
    stop: number
    parcial: number
    alvo: number
    pts_parcial: number
    pts_alvo: number
    pts_stop: number
  } | null
  posicao_ativa?: {
    tipo: 'COMPRA' | 'VENDA'
    entrada: number
    sl_dinamico: number
    parcial_feita: boolean
    pnl_pts: number
  } | null
}

export function FluxoIAWidget() {
  const [data, setData] = useState<FluxoIAData | null>(null)
  const [loading, setLoading] = useState(true)
  const lastRealtimeTs = useRef<number>(0)

  const fetchStatus = async () => {
    if (Date.now() - lastRealtimeTs.current < 3000) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/fluxo-ia')
      if (res.ok) {
        const json = await res.json()
        if (Date.now() - lastRealtimeTs.current >= 3000) {
          setData(json)
        }
      }
    } catch (e) {
      console.error('Erro ao buscar status do Fluxo IA:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 1000)

    const supabase = createClient()
    const channel = supabase
      .channel('fluxo_ia')
      .on('broadcast', { event: 'status' }, (msg) => {
        if (msg?.payload) {
          lastRealtimeTs.current = Date.now()
          setData({ online: true, ...msg.payload })
          setLoading(false)
        }
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading && !data) {
    return (
      <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5 shadow-lg flex items-center justify-between text-gray-400">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-yellow-500 animate-ping" />
          <span className="text-sm font-semibold tracking-wide">Carregando Fluxo IA Master...</span>
        </div>
      </div>
    )
  }

  const estado = data?.estado || 'OFFLINE'
  const isOnline = data?.online ?? false
  const sinal = data?.sinal

  // Helpers de Formatação
  const fmt = (v?: number) => (v !== undefined ? v.toFixed(1).replace('.', ',') : '---')
  const fmtSign = (v?: number) => {
    if (v === undefined) return '---'
    const sign = v > 0 ? '+' : ''
    return `${sign}${v.toFixed(1)}`.replace('.', ',')
  }

  // Definições visuais conforme o estado
  let statusBadge = {
    title: 'NEUTRO',
    sub: 'Monitorando Mercado',
    bgColor: 'bg-zinc-800/80',
    textColor: 'text-zinc-300',
    borderColor: 'border-zinc-700',
    icon: <Minus className="w-4 h-4 text-zinc-400" />
  }

  if (!isOnline && estado === 'OFFLINE') {
    statusBadge = {
      title: 'AGUARDANDO CONEXÃO',
      sub: 'Inicie master_fluxo_ia.py no MT5',
      bgColor: 'bg-zinc-900',
      textColor: 'text-zinc-500',
      borderColor: 'border-zinc-800',
      icon: <Radio className="w-4 h-4 text-zinc-600" />
    }
  } else if (estado === 'COOLDOWN') {
    statusBadge = {
      title: `COOLDOWN (${data?.cooldown_restante_seg || 0}s)`,
      sub: 'Pausa Anti-Repique',
      bgColor: 'bg-blue-950/40',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-800/60',
      icon: <Clock className="w-4 h-4 text-blue-400" />
    }
  } else if (estado === 'PREPARAR_COMPRA') {
    statusBadge = {
      title: 'PREPARAR COMPRA',
      sub: 'Exaustão na Venda Detectada',
      bgColor: 'bg-amber-950/50',
      textColor: 'text-amber-400 animate-pulse',
      borderColor: 'border-amber-600/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
    }
  } else if (estado === 'PREPARAR_VENDA') {
    statusBadge = {
      title: 'PREPARAR VENDA',
      sub: 'Exaustão na Compra Detectada',
      bgColor: 'bg-amber-950/50',
      textColor: 'text-amber-400 animate-pulse',
      borderColor: 'border-amber-600/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
    }
  } else if (estado === 'COMPRA' || (estado === 'EM_OPERACAO' && sinal?.tipo === 'COMPRA')) {
    statusBadge = {
      title: estado === 'EM_OPERACAO' ? 'EM OPERAÇÃO: COMPRA' : 'COMPRA CONFIRMADA',
      sub: 'Reversão Institucional VWAP',
      bgColor: 'bg-emerald-950/60',
      textColor: 'text-emerald-400 font-bold',
      borderColor: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />
    }
  } else if (estado === 'VENDA' || (estado === 'EM_OPERACAO' && sinal?.tipo === 'VENDA')) {
    statusBadge = {
      title: estado === 'EM_OPERACAO' ? 'EM OPERAÇÃO: VENDA' : 'VENDA CONFIRMADA',
      sub: 'Reversão Institucional VWAP',
      bgColor: 'bg-rose-950/60',
      textColor: 'text-rose-400 font-bold',
      borderColor: 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      icon: <TrendingDown className="w-5 h-5 text-rose-400" />
    }
  }

  const temAlvos = sinal && (estado === 'COMPRA' || estado === 'VENDA' || estado === 'PREPARAR_COMPRA' || estado === 'PREPARAR_VENDA' || estado === 'EM_OPERACAO')

  return (
    <div className={`bg-[#121214] border rounded-xl p-4 transition-all duration-300 shadow-md ${statusBadge.borderColor}`}>
      {/* Header do Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-wide">FLUXO IA MASTER</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                {data?.ativo || 'WDO'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {isOnline ? 'LIVE MT5' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Reversão Institucional VWAP</p>
          </div>
        </div>

        {/* Badge Principal de Estado */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border ${statusBadge.bgColor} ${statusBadge.borderColor}`}>
          {statusBadge.icon}
          <div className="flex flex-col text-right">
            <span className={`text-xs font-black tracking-wider ${statusBadge.textColor}`}>
              {statusBadge.title}
            </span>
            <span className="text-[10px] text-zinc-400 leading-none">
              {statusBadge.sub}
            </span>
          </div>
        </div>
      </div>

      {/* Seção 2: Métricas de Monitoramento Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 py-1">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">AFAST. VWAP</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-sm font-bold font-mono ${
              (data?.dist_abs || 0) >= 10.0 && (data?.dist_abs || 0) <= 22.0 ? 'text-amber-400 font-black' :
              (data?.dist_abs || 0) > 22.0 ? 'text-rose-400 font-bold' : 'text-zinc-200'
            }`}>
              {fmtSign(data?.dist_pts)} pts
            </span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">VWAP: {fmt(data?.vwap)}</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Z-SCORE (DESVIO)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-sm font-bold font-mono ${
              Math.abs(data?.z_score || 0) >= 1.8 ? 'text-amber-400 font-black' : 'text-zinc-200'
            }`}>
              {data?.z_score !== undefined ? `${data.z_score > 0 ? '+' : ''}${data.z_score.toFixed(2)}σ` : '---'}
            </span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">Gatilho: |Z| ≥ 1.80</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">DELTA 10s (REAÇÃO)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-sm font-bold font-mono ${
              (data?.delta_10s || 0) >= 100 ? 'text-emerald-400' :
              (data?.delta_10s || 0) <= -100 ? 'text-rose-400' : 'text-zinc-300'
            }`}>
              {data?.delta_10s !== undefined ? `${data.delta_10s > 0 ? '+' : ''}${data.delta_10s}` : '---'}
            </span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">30s: {data?.delta_30s !== undefined ? `${data.delta_30s > 0 ? '+' : ''}${data.delta_30s}` : '---'}</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">PREÇO ATUAL</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-bold font-mono text-zinc-100">
              {fmt(data?.preco_atual)}
            </span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">B: {fmt(data?.bid)} | A: {fmt(data?.ask)}</span>
        </div>
      </div>

      {/* Seção 3: Box de Entrada, Stop e Alvos (Exibido em Preparar ou Entrada) */}
      {temAlvos && sinal ? (
        <div className="mt-2.5 p-3 rounded-lg bg-zinc-900/90 border border-zinc-700/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-zinc-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-zinc-400" />
              <span>PARÂMETROS DA OPERAÇÃO ({sinal.tipo})</span>
            </div>
            {estado.startsWith('PREPARAR') && (
              <span className="text-amber-400 font-medium text-[10px] animate-pulse">
                • Aguardando virada de Delta para disparar
              </span>
            )}
            {data?.posicao_ativa && (
              <span className={`font-mono font-bold text-[11px] ${
                data.posicao_ativa.pnl_pts >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                PnL: {fmtSign(data.posicao_ativa.pnl_pts)} pts
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            {/* ENTRADA */}
            <div className="flex flex-col bg-zinc-800/50 rounded p-1.5 border border-zinc-700/60">
              <span className="text-[10px] font-bold text-zinc-400">ENTRADA</span>
              <span className="text-sm font-mono font-black text-white mt-0.5">
                {fmt(sinal.entrada)}
              </span>
              <span className="text-[9px] text-zinc-500">Referência</span>
            </div>

            {/* STOP LOSS */}
            <div className="flex flex-col bg-rose-950/20 rounded p-1.5 border border-rose-900/40">
              <span className="text-[10px] font-bold text-rose-400 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400" /> STOP
              </span>
              <span className="text-sm font-mono font-black text-rose-300 mt-0.5">
                {fmt(sinal.stop)}
              </span>
              <span className="text-[9px] text-rose-500">-{sinal.pts_stop} pts</span>
            </div>

            {/* PARCIAL */}
            <div className="flex flex-col bg-emerald-950/20 rounded p-1.5 border border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PARCIAL
              </span>
              <span className="text-sm font-mono font-black text-emerald-300 mt-0.5">
                {fmt(sinal.parcial)}
              </span>
              <span className="text-[9px] text-emerald-500">+{sinal.pts_parcial} pts (Move SL 0.0)</span>
            </div>

            {/* ALVO FINAL */}
            <div className="flex flex-col bg-emerald-950/30 rounded p-1.5 border border-emerald-700/60">
              <span className="text-[10px] font-bold text-emerald-300 flex items-center justify-center gap-1">
                <Target className="w-3 h-3 text-emerald-300" /> ALVO FINAL
              </span>
              <span className="text-sm font-mono font-black text-emerald-200 mt-0.5">
                {fmt(sinal.alvo)}
              </span>
              <span className="text-[9px] text-emerald-400 font-medium">+{sinal.pts_alvo} pts</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/60 pt-2 px-1">
          <span>Janela Técnica: 09:20 às 13:30 (Stop: 8.0 pts | Parcial: +5.0 pts | Alvo: +10.0 pts)</span>
          <span>{data?.updatedAtStr ? `Último tick: ${data.updatedAtStr}` : ''}</span>
        </div>
      )}
    </div>
  )
}
