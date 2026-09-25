'use client'

import { useState, useEffect } from 'react'

type AssetQuoteProps = {
  nome?: string
  codigo: string
  fonte: 'yahoo' | 'tradingview'
  layout?: 'col' | 'row'
}

export function AssetQuote({ codigo, fonte, layout = 'col', nome }: AssetQuoteProps) {
  const [quote, setQuote] = useState<{ price?: number; changePercent?: number; error?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchQuote() {
      try {
        setLoading(true)
        const res = await fetch(`/api/quote?symbol=${encodeURIComponent(codigo)}&source=${fonte}`)
        const data = await res.json()
        
        if (isMounted) {
          if (res.ok) {
            setQuote({ price: data.price, changePercent: data.changePercent })
          } else {
            setQuote({ error: data.error || 'Erro' })
          }
        }
      } catch (err) {
        if (isMounted) setQuote({ error: 'Falha' })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchQuote()
    
    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchQuote, 30000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [codigo, fonte])

  if (loading && !quote) {
    return <span className="text-sm font-medium text-slate-400 animate-pulse">Carregando...</span>
  }

  if (quote?.error) {
    return <span className="text-xs font-medium text-red-400">Nǜo encontrado</span>
  }

  const isPositive = (quote?.changePercent ?? 0) >= 0
  const colorClass = isPositive ? 'text-emerald-400' : 'text-red-400'

  if (layout === 'row') {
    let dotColor = 'bg-slate-500'
    const pct = quote?.changePercent ?? 0
    if (pct < -0.99) dotColor = 'bg-red-500'
    else if (pct > 0.99) dotColor = 'bg-emerald-500'
    else dotColor = 'bg-yellow-500'

    return (
      <>
        {nome && (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
            <div className="text-[11px] font-medium text-slate-300 truncate max-w-[120px]" title={nome}>
              {nome}
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-3 ml-auto">
          <span className="text-[10px] text-slate-400 font-mono">
            {quote?.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
          <span className={`text-sm font-bold w-16 text-right ${colorClass}`}>
            {isPositive ? '+' : ''}{(quote?.changePercent ?? 0).toFixed(2)}%
          </span>
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col items-end">
      <span className="text-sm font-bold text-slate-200">
        {quote?.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
      </span>
      <span className={`text-[10px] font-medium ${colorClass}`}>
        {isPositive ? '+' : ''}{(quote?.changePercent ?? 0).toFixed(2)}%
      </span>
    </div>
  )
}
