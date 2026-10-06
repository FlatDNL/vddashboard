import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace activeModalEventId with activeModalTime and add debugOffset
old_state = '''  const [nowTimer, setNowTimer] = useState(new Date())
  const [activeModalEventId, setActiveModalEventId] = useState<string | null>(null)
  const triggeredModals = useRef<Set<string>>(new Set())
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeModalEventId) return;
    const activeModalEvent = news.find(n => n.id === activeModalEventId);
    if (activeModalEvent?.pressure?.direction && activeModalEvent.pressure.direction !== 'AGUARDANDO') {
      const t = setTimeout(() => {
        setActiveModalEventId(null);
      }, 10000);
      return () => clearTimeout(t);
    }
  }, [activeModalEventId, news]);'''

new_state = '''  const [nowTimer, setNowTimer] = useState(new Date())
  const [debugOffset, setDebugOffset] = useState(0)
  const [activeModalTime, setActiveModalTime] = useState<string | null>(null)
  const triggeredModals = useRef<Set<string>>(new Set())
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeModalTime) return;
    const modalEvents = news.filter(n => n.dateIso === activeModalTime);
    if (modalEvents.length > 0) {
      // Checa se TODOS os eventos deste horário já tiveram a pressão calculada
      const allCalculated = modalEvents.every(e => e.pressure?.direction && e.pressure.direction !== 'AGUARDANDO');
      if (allCalculated) {
        const t = setTimeout(() => {
          setActiveModalTime(null);
        }, 10000);
        return () => clearTimeout(t);
      }
    }
  }, [activeModalTime, news]);'''

content = content.replace(old_state, new_state)

# Replace interval logic
old_interval = '''  useEffect(() => {
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

new_interval = '''  useEffect(() => {
    const currentMs = nowTimer.getTime() + debugOffset
    news.forEach(item => {
      if (!item.dateIso) return
      const eventMs = new Date(item.dateIso).getTime()
      const diffSeconds = Math.floor((eventMs - currentMs) / 1000)
      
      // Faltando 5 segundos para a noticia
      if (diffSeconds <= 5 && diffSeconds > -300 && !triggeredModals.current.has(item.dateIso)) {
        triggeredModals.current.add(item.dateIso)
        setActiveModalTime(item.dateIso)
      }
    })
  }, [nowTimer, debugOffset, news])

  // Funções de Debug
  const testYellow = () => {
    const nextEvent = news.find(n => n.dateIso)
    if (nextEvent) {
      setDebugOffset(new Date(nextEvent.dateIso).getTime() - 299000 - new Date().getTime())
    }
  }
  const testRed = () => {
    const nextEvent = news.find(n => n.dateIso)
    if (nextEvent) {
      setDebugOffset(new Date(nextEvent.dateIso).getTime() - 59000 - new Date().getTime())
    }
  }
  const testModal = () => {
    const nextEvent = news.find(n => n.dateIso)
    if (nextEvent) {
      setDebugOffset(new Date(nextEvent.dateIso).getTime() - 5000 - new Date().getTime())
    }
  }
  const testReset = () => {
    setDebugOffset(0)
    triggeredModals.current.clear()
    setActiveModalTime(null)
  }
'''
content = content.replace(old_interval, new_interval)

# Replace news render loop to use debugOffset in table
old_render = '''                          if (item.dateIso) {
                            const diffSeconds = Math.floor((new Date(item.dateIso).getTime() - nowTimer.getTime()) / 1000)
                            if (diffSeconds > 0 && diffSeconds <= 300) {'''

new_render = '''                          if (item.dateIso) {
                            const diffSeconds = Math.floor((new Date(item.dateIso).getTime() - (nowTimer.getTime() + debugOffset)) / 1000)
                            if (diffSeconds > 0 && diffSeconds <= 300) {'''

content = content.replace(old_render, new_render)

# Inject debug buttons below the table body
old_tbody_end = '''                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>'''

new_tbody_end = '''                        </tbody>
                      </table>
                    </div>
                    {/* Botões de Debug */}
                    <div className="flex justify-center gap-2 p-2 bg-[#1c1c1c] border-t border-[#333] shrink-0">
                      <button onClick={testYellow} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-[10px] font-bold uppercase rounded">Test Amarelo</button>
                      <button onClick={testRed} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase rounded">Test Vermelho</button>
                      <button onClick={testModal} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded">Test Modal</button>
                      <button onClick={testReset} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-[10px] font-bold uppercase rounded">Reset</button>
                    </div>
                  </div>
                </div>'''

content = content.replace(old_tbody_end, new_tbody_end)

# Replace the entire Modal JSX at the end
old_modal = '''      {/* Modal Notícia */}
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
      })()}'''

new_modal = '''      {/* Modal Notícias */}
      {(() => {
        if (!activeModalTime) return null;
        const modalEvents = news.filter(n => n.dateIso === activeModalTime)
        if (modalEvents.length === 0) return null;
        
        return (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl w-full max-w-4xl shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-300 max-h-[90vh]">
              
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-6 border-b border-[#333] shrink-0">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm font-mono tracking-widest">EVENTOS AO VIVO • {modalEvents[0]?.time}</span>
                  <h2 className="text-2xl font-bold text-white uppercase">Resultados Simultâneos</h2>
                </div>
                <button onClick={() => setActiveModalTime(null)} className="text-gray-400 hover:text-white bg-[#333] hover:bg-[#444] p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              {/* Corpo Rolável */}
              <div className="flex flex-col gap-6 p-6 overflow-y-auto">
                {modalEvents.map((evt, idx) => (
                  <div key={idx} className="bg-[#2a2a2a] border border-[#444] rounded-xl flex flex-col overflow-hidden">
                    
                    <div className="flex items-center gap-3 p-4 border-b border-[#333] bg-[#333]">
                      <span className="text-3xl">{evt.country === 'US' ? '🇺🇸' : evt.country === 'BR' ? '🇧🇷' : evt.country}</span>
                      <h3 className="text-xl font-bold text-white uppercase truncate">{evt.title}</h3>
                    </div>
                    
                    <div className="flex flex-col xl:flex-row p-4 gap-6">
                      
                      {/* Lado Esquerdo: Estatísticas */}
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-gray-500 text-[10px] xl:text-xs tracking-widest mb-1">ANTERIOR</span>
                          <span className="text-lg xl:text-xl font-bold text-gray-300">{evt.previous !== '-' ? evt.previous : '---'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center border-x border-[#444]">
                          <span className="text-gray-500 text-[10px] xl:text-xs tracking-widest mb-1">PROJEÇÃO</span>
                          <span className="text-lg xl:text-xl font-bold text-gray-300">{evt.forecast !== '-' ? evt.forecast : '---'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-blue-400 text-[10px] xl:text-xs tracking-widest mb-1 font-bold">ATUAL</span>
                          <span className="text-2xl xl:text-3xl font-bold text-white">{evt.actual !== '-' ? evt.actual : '---'}</span>
                        </div>
                      </div>
                      
                      {/* Lado Direito: Pressão */}
                      <div className="flex flex-col items-center justify-center bg-[#0f172a] border border-[#1e293b] p-4 rounded-lg w-full xl:w-[280px] shrink-0">
                        <span className="text-gray-400 text-[10px] tracking-widest mb-2">PRESSÃO DÓLAR</span>
                        {evt.pressure?.direction && evt.pressure.direction !== 'AGUARDANDO' ? (
                          <>
                            <div className={`text-2xl xl:text-3xl font-black mb-1 ${
                              evt.pressure.direction === 'ALTA' ? 'text-emerald-500' :
                              evt.pressure.direction === 'BAIXA' ? 'text-red-500' : 'text-yellow-500'
                            }`}>
                              {evt.pressure.direction === 'ALTA' ? 'COMPRA' : evt.pressure.direction === 'BAIXA' ? 'VENDA' : 'NEUTRO'}
                            </div>
                            <p className="text-gray-400 text-center text-[10px] xl:text-xs">{evt.pressure.explanation}</p>
                          </>
                        ) : (
                          <div className="flex flex-col items-center animate-pulse">
                            <div className="text-lg xl:text-xl font-bold text-yellow-500 mb-1">AGUARDANDO...</div>
                            <p className="text-gray-500 text-center text-[10px]">Calculando impacto</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer do Modal */}
              <div className="p-4 border-t border-[#333] shrink-0">
                <button onClick={() => setActiveModalTime(null)} className="w-full bg-[#444] hover:bg-[#555] text-white py-3 rounded font-bold uppercase tracking-widest transition-colors">
                  FECHAR JANELA
                </button>
              </div>
            </div>
          </div>
        );
      })()}'''

# Note: The old modal block might be slightly different in spacing, so we use a regex or replace the exact block we wrote earlier
import re

# Since I know I added `{/* Modal Notícia */}` earlier:
modal_regex = r'\{\/\* Modal Notícia \*\/\}.*?\}\)\(\)\}'

content = re.sub(modal_regex, new_modal.replace('Modal Notícias', 'Modal Notícia'), content, flags=re.DOTALL)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
