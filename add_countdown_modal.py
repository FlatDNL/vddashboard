import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add X to lucide-react imports
content = content.replace("import { Maximize, Minimize } from 'lucide-react'", "import { Maximize, Minimize, X } from 'lucide-react'")

# 2. Add state hooks inside component
state_hooks_old = '''  const [news, setNews] = useState<any[]>([])
  const [aggression, setAggression] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)'''

state_hooks_new = '''  const [news, setNews] = useState<any[]>([])
  const [aggression, setAggression] = useState<any[]>([])
  
  const [nowTimer, setNowTimer] = useState(new Date())
  const [activeModalEventId, setActiveModalEventId] = useState<string | null>(null)
  const triggeredModals = useRef<Set<string>>(new Set())
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setNowTimer(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    const currentMs = nowTimer.getTime()
    news.forEach(item => {
      if (!item.dateIso) return
      const eventMs = new Date(item.dateIso).getTime()
      const diffSeconds = Math.floor((eventMs - currentMs) / 1000)
      
      // Faltando 5 segundos para a noticia
      if (diffSeconds <= 5 && diffSeconds > -300 && !triggeredModals.current.has(item.id)) {
        triggeredModals.current.add(item.id)
        setActiveModalEventId(item.id)
      }
    })
  }, [nowTimer, news])'''

content = content.replace(state_hooks_old, state_hooks_new)

# 3. Modify the news rendering loop
news_render_old = '''                        {news.map((item, i) => {
                          const isHigh = item.impact === 'HIGH'
                          const isMed = item.impact === 'MEDIUM'
                          const impactText = isHigh ? 'ALTO' : isMed ? 'MÉDIO' : 'BAIXO'
                          const impactColor = isHigh ? 'text-[#ef4444]' : isMed ? 'text-yellow-400' : 'text-[#22c55e]'
                          return (
                            <tr key={i} className="border-b border-[#222] hover:bg-[#333] transition-colors leading-tight">
                              <td className="py-1 px-1 text-gray-400">{item.time}</td>'''

news_render_new = '''                        {news.map((item, i) => {
                          const isHigh = item.impact === 'HIGH'
                          const isMed = item.impact === 'MEDIUM'
                          const impactText = isHigh ? 'ALTO' : isMed ? 'MÉDIO' : 'BAIXO'
                          const impactColor = isHigh ? 'text-[#ef4444]' : isMed ? 'text-yellow-400' : 'text-[#22c55e]'
                          
                          let rowClass = "border-b border-[#222] hover:bg-[#333] transition-colors leading-tight"
                          let displayTime = item.time
                          let textTimeClass = "text-gray-400"
                          
                          if (item.dateIso) {
                            const diffSeconds = Math.floor((new Date(item.dateIso).getTime() - nowTimer.getTime()) / 1000)
                            if (diffSeconds > 0 && diffSeconds <= 300) {
                              const m = Math.floor(diffSeconds / 60).toString().padStart(2, '0')
                              const s = (diffSeconds % 60).toString().padStart(2, '0')
                              displayTime = `${m}:${s}`
                              textTimeClass = "text-white font-bold"
                              if (diffSeconds <= 60) {
                                rowClass = "border-b border-red-500 bg-[#451a1a] transition-colors leading-tight"
                              } else {
                                rowClass = "border-b border-yellow-500 bg-[#423812] transition-colors leading-tight"
                              }
                            }
                          }
                          
                          return (
                            <tr key={i} className={rowClass}>
                              <td className={`py-1 px-1 font-mono w-16 ${textTimeClass}`}>{displayTime}</td>'''

# We need to make sure we don't mess up encoding, let's use standard string replacement carefully
content = content.replace(news_render_old.replace('MÉDIO', 'M%DIO'), news_render_new)
content = content.replace(news_render_old, news_render_new)

# 4. Add the Modal JSX at the bottom before the last `</div>`
# Let's find the end of the return statement
end_marker = '    </div>\n  )\n}'

modal_jsx = '''      
      {/* Modal Notícia */}
      {(() => {
        const activeModalEvent = activeModalEventId ? news.find(n => n.id === activeModalEventId) : null
        
        // Setup timeout para fechar 10s após resultado
        if (activeModalEvent?.pressure?.direction && activeModalEvent.pressure.direction !== 'AGUARDANDO') {
           setTimeout(() => {
             setActiveModalEventId(null)
           }, 10000)
        }
        
        if (!activeModalEvent) return null;
        
        return (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-6 relative animate-in fade-in zoom-in duration-300">
              <button onClick={() => setActiveModalEventId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-3">
                <span className="text-4xl">{activeModalEvent.country === 'US' ? '🇺🇸' : activeModalEvent.country === 'BR' ? '🇧🇷' : activeModalEvent.country}</span>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm font-mono tracking-widest">{activeModalEvent.time} • EVENTO AO VIVO</span>
                  <h2 className="text-2xl font-bold text-white uppercase">{activeModalEvent.title}</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 border-y border-[#333] py-4">
                <div className="flex flex-col items-center">
                  <span className="text-gray-500 text-xs tracking-widest mb-1">ANTERIOR</span>
                  <span className="text-xl font-bold text-gray-300">{activeModalEvent.previous !== '-' ? activeModalEvent.previous : '---'}</span>
                </div>
                <div className="flex flex-col items-center border-x border-[#333]">
                  <span className="text-gray-500 text-xs tracking-widest mb-1">PROJEÇÃO</span>
                  <span className="text-xl font-bold text-gray-300">{activeModalEvent.forecast !== '-' ? activeModalEvent.forecast : '---'}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-blue-400 text-xs tracking-widest mb-1 font-bold">ATUAL</span>
                  <span className="text-3xl font-bold text-white">{activeModalEvent.actual !== '-' ? activeModalEvent.actual : '---'}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-[#0f172a] border border-[#1e293b] p-6 rounded-lg">
                <span className="text-gray-400 text-xs tracking-widest mb-3">PRESSÃO DÓLAR (WDO)</span>
                {activeModalEvent.pressure?.direction && activeModalEvent.pressure.direction !== 'AGUARDANDO' ? (
                  <>
                    <div className={`text-4xl font-black mb-2 ${
                      activeModalEvent.pressure.direction === 'ALTA' ? 'text-emerald-500' :
                      activeModalEvent.pressure.direction === 'BAIXA' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {activeModalEvent.pressure.direction === 'ALTA' ? 'COMPRA' : activeModalEvent.pressure.direction === 'BAIXA' ? 'VENDA' : 'NEUTRO'}
                    </div>
                    <p className="text-gray-400 text-center text-sm">{activeModalEvent.pressure.explanation}</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center animate-pulse">
                    <div className="text-2xl font-bold text-yellow-500 mb-2">AGUARDANDO...</div>
                    <p className="text-gray-500 text-center text-sm">Calculando impacto no Dólar</p>
                  </div>
                )}
              </div>
              
              <button onClick={() => setActiveModalEventId(null)} className="w-full bg-[#333] hover:bg-[#444] text-white py-3 rounded font-bold uppercase tracking-widest transition-colors mt-2">
                FECHAR
              </button>
            </div>
          </div>
        );
      })()}
'''

content = content.replace(end_marker, modal_jsx + end_marker)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
