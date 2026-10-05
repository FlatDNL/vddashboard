'use client'

import { useState, useEffect } from 'react'
import { Calculator } from 'lucide-react'
import { useMarketParamsStore } from '@/store/marketParams'

type PlanilhaData = {
  atual: number
  justo: number
  justissimo: number
  maxima: number
  minima: number
  status: 'COMPRA' | 'VENDA' | 'NEUTRO'
  metrics: {
    dxyPct: number
    emPct: number
  }
}

export function FairValueWidget() {
  const [data, setData] = useState<PlanilhaData | null>(null)
  const [loading, setLoading] = useState(true)
  const { manualFechamento, setManualParams, manualDxyPct, lastUpdated } = useMarketParamsStore()
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        const params = new URLSearchParams()
        if (manualFechamento !== null) params.set('base', manualFechamento.toString())
        if (manualDxyPct !== null) params.set('dxy', manualDxyPct.toString())

        const queryString = params.toString()
        const url = queryString ? `/api/fair-value?${queryString}` : '/api/fair-value'
        const res = await fetch(url)
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

    fetchData()
    const interval = setInterval(fetchData, 10000) 
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [manualFechamento, manualDxyPct])

  const handleUpdate = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      // Pega os dados direto do bridge
      const res = await fetch('/api/profit-bridge')
      const bridgeData = await res.json()
      
      if (bridgeData.ajusteAnterior && bridgeData.fechamentoAnterior) {
        const now = new Date().toLocaleString('pt-BR')
        setManualParams(bridgeData.ajusteAnterior, manualDxyPct, bridgeData.fechamentoAnterior, now)
      } else {
        setErrorMsg('Não foi possível capturar o Ajuste/Fechamento. Verifique a planilha.')
        setTimeout(() => setErrorMsg(''), 5000)
      }
    } catch (e) {
      console.error(e)
      setErrorMsg('Erro de conexão com o Profit Bridge.')
      setTimeout(() => setErrorMsg(''), 5000)
    }
    setLoading(false)
  }

  if (loading || !data) {
    return (
      <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-4 flex items-center justify-center min-h-[200px] animate-pulse">
        <span className="text-slate-500 text-sm">Carregando Preço Justo...</span>
      </div>
    )
  }

  const formatPts = (val: number) => {
    return (Math.round(val * 2) / 2).toFixed(1).replace('.', ',')
  }

  const isCompra = data.status === 'COMPRA'
  const isVenda = data.status === 'VENDA'

  return (
    <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-4 flex flex-col justify-between h-auto relative overflow-hidden min-w-[300px]">
      
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 ${
        isCompra ? 'bg-green-500' : isVenda ? 'bg-red-500' : 'bg-slate-500'
      }`} />

      {/* Header com Título */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">Preço Justo do Dólar</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[9px] text-slate-500">Att: {lastUpdated}</span>
          )}
          <button 
            onClick={handleUpdate}
            className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/20 text-[10px] px-2 py-1 rounded transition-colors font-medium"
            title="Atualizar Base (Planilha)"
          >
            Atualizar
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="relative z-10 w-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] py-1 px-2 rounded mb-3 text-center">
          {errorMsg}
        </div>
      )}

      {/* Tabela Compacta de Valores */}
      <div className="flex flex-col space-y-0.5 relative z-10">
        <div className="flex justify-between items-center py-1.5 border-b border-[#1e293b]/50">
          <span className="text-xs text-slate-400">Preço Justo (Base):</span>
          <span className="text-sm font-bold text-slate-300">{formatPts(data.justo)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1.5 border-b border-[#1e293b]/50">
          <span className="text-xs text-slate-400">Justíssimo:</span>
          <span className="text-sm font-bold text-blue-400">{formatPts(data.justissimo)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1.5 border-b border-[#1e293b]/50">
          <span className="text-xs text-slate-400">Máxima (Resistência):</span>
          <span className="text-sm font-bold text-red-400">{formatPts(data.maxima)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1.5">
          <span className="text-xs text-slate-400">Mínima (Suporte):</span>
          <span className="text-sm font-bold text-green-400">{formatPts(data.minima)}</span>
        </div>
      </div>

    </div>
  )
}

