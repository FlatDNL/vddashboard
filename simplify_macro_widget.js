const fs = require('fs');

const path = 'src/components/MacroOverviewWidget.tsx';
const content = `"use client"

import { useState, useEffect } from 'react'
import { ExternalLink, Clock, Newspaper } from 'lucide-react'

export default function MacroOverviewWidget() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const newsRes = await fetch('/api/macro-news')
        const newsData = await newsRes.json()
        setArticles(newsData.articles || [])
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

  return (
    <div className="flex flex-col gap-6">
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
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-start justify-between gap-4 w-full">
                <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors leading-relaxed">
                  {art.title}
                </h4>
                {art.score >= 3 && (
                  <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    ALTO IMPACTO WDO
                  </span>
                )}
                {(art.score === 1 || art.score === 2) && (
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    RELEVANTE
                  </span>
                )}
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
`;

fs.writeFileSync(path, content, 'utf8');
