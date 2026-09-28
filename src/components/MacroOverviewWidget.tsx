"use client"

import { useState, useEffect } from 'react'
import { ExternalLink, Clock, Newspaper, TrendingUp, TrendingDown, Hash, Sparkles } from 'lucide-react'
import { useNotificationStore } from '@/store/notifications'

export default function MacroOverviewWidget() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzingAI, setAnalyzingAI] = useState(false)

    const forceAIAnalysis = async () => {
    setAnalyzingAI(true)
    try {
      const apiKey = localStorage.getItem('gemini_api_key')
      if (!apiKey) {
        useNotificationStore.getState().addNotification({
          title: 'IA não configurada',
          message: 'Vá nas configurações e insira a chave do Gemini.',
          type: 'warning'
        })
        setAnalyzingAI(false)
        return
      }
      const newsRes = await fetch('/api/macro-news', {
        headers: {
          'x-gemini-key': apiKey,
          'x-force-ai': 'true'
        }
      })
      const newsData = await newsRes.json()
      setArticles(newsData.articles || [])
      
      if (newsData.aiError) {
        useNotificationStore.getState().addNotification({
          title: 'Falha na IA',
          message: 'Erro: ' + newsData.aiError,
          type: 'error'
        })
      }
    } catch (e) {
    } finally {
      setAnalyzingAI(false)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const apiKey = localStorage.getItem('gemini_api_key')
        const newsRes = await fetch('/api/macro-news', {
          headers: {
            'x-gemini-key': apiKey || ''
          }
        })
        const newsData = await newsRes.json()
        setArticles(newsData.articles || [])
        
        if (newsData.aiError) {
          useNotificationStore.getState().addNotification({
            title: 'Falha na IA',
            message: 'A comunicação com o Google Gemini falhou: ' + newsData.aiError + '. O sistema voltou a usar o algoritmo padrão temporariamente.',
            type: 'error'
          })
        }
      } catch (error) {
        console.error("Error fetching macro news:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 180000) // 3 minutes
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-[#1e293b]/50 rounded-xl border border-[#1e293b]"></div>
        ))}
      </div>
    )
  }

  const hasUnanalyzed = articles.some(a => a.analysisType !== 'AI');

  return (
    <div className="flex flex-col gap-6">
      
      {hasUnanalyzed && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-400" size={20} />
            <div>
              <h3 className="text-sm font-bold text-slate-200">Existem notícias não analisadas pela IA</h3>
              <p className="text-xs text-slate-400">Clique para rodar uma análise profunda com o Gemini.</p>
            </div>
          </div>
          <button 
            onClick={forceAIAnalysis}
            disabled={analyzingAI}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {analyzingAI ? 'Analisando...' : 'Analisar com IA'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <Newspaper className="text-blue-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Manchetes de Impacto</h2>
          <p className="text-sm text-slate-400">Feed inteligente atualizado em tempo real para o Dólar (WDO)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {articles.map((art: any) => (
          <a
            key={art.id}
            href={art.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0b1120] rounded-xl border border-[#1e293b] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-500/40 hover:bg-[#1e293b]/20 transition-all group"
          >
            {art.imageUrl && (
              <div className="shrink-0 w-full md:w-32 md:h-24 h-40 overflow-hidden rounded-lg border border-[#1e293b] group-hover:border-blue-500/30 transition-colors">
                <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-start justify-between gap-4 w-full">
                <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors leading-relaxed">
                  {art.title}
                </h4>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  {art.score >= 3 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      ALTO IMPACTO
                    </span>
                  )}
                  {(art.score === 1 || art.score === 2) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      RELEVANTE
                    </span>
                  )}

                  {art.wdoPressure === 'ALTA' && (
                    <div className="flex items-center gap-1.5">
                      {art.analysisType === 'AI' ? <Sparkles size={12} className="text-purple-400" /> : <Hash size={12} className="text-slate-500" />}
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <TrendingUp size={12} /> ALTA WDO
                      </span>
                    </div>
                  )}
                  {art.wdoPressure === 'BAIXA' && (
                    <div className="flex items-center gap-1.5">
                      {art.analysisType === 'AI' ? <Sparkles size={12} className="text-purple-400" /> : <Hash size={12} className="text-slate-500" />}
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        <TrendingDown size={12} /> BAIXA WDO
                      </span>
                    </div>
                  )}
                  {art.wdoPressure === 'NEUTRO' && (
                    <div className="flex items-center gap-1.5">
                      {art.analysisType === 'AI' ? <Sparkles size={12} className="text-purple-400" /> : <Hash size={12} className="text-slate-500" />}
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        NEUTRO
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {art.summary && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>
              )}

              <div className="flex items-center justify-between w-full mt-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="px-2 py-0.5 bg-slate-800 rounded-md font-medium">{art.publisher}</span>
                  <span>•</span>
                  <span className="font-mono flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(art.providerPublishTime).toLocaleDateString('pt-BR')} às {new Date(art.providerPublishTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="p-1.5 bg-[#0f172a] rounded-md border border-[#1e293b] text-slate-400 group-hover:text-blue-400 transition-colors shrink-0">
                  <ExternalLink size={14} />
                </div>
              </div>
            </div>
          </a>
        ))}
        {articles.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs italic bg-[#0b1120] rounded-xl border border-[#1e293b]">
            Nenhuma manchete financeira encontrada no momento.
          </div>
        )}
      </div>
    </div>
  )
}
