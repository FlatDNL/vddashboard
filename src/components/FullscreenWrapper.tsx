'use client'

import { useState, useRef, useEffect } from 'react'
import { Maximize, Minimize } from 'lucide-react'

export function FullscreenWrapper({ children, rightSidebar }: { children: React.ReactNode, rightSidebar: React.ReactNode }) {
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
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-4 h-full">
      <div 
        ref={containerRef}
        className={`flex-1 flex flex-col gap-4 overflow-y-auto pb-6 relative ${
          isFullscreen ? 'bg-[#0b1120] p-6' : ''
        }`}
      >
        {/* Botão de Tela Cheia (Aparece no Hover) */}
        <div className="absolute top-0 left-0 z-50 p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-600 transition-all shadow-xl backdrop-blur-md"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span className="text-xs font-semibold">{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
          </button>
        </div>

        {/* Content */}
        <div className={isFullscreen ? 'pt-10 h-full' : 'h-full'}>
          {children}
        </div>
      </div>

      {/* Right Sidebar Column (Collapsible) */}
      {!isFullscreen && rightSidebar}
    </div>
  )
}
