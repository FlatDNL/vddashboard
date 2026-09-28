const fs = require('fs');

const pathStr = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

if (!content.includes('profitStatus')) {
  // Add imports
  content = content.replace(
    "import { Activity,",
    "import { Activity, Play, RefreshCw,"
  );

  // Add state and effect
  const newStates = `  const [profitStatus, setProfitStatus] = useState<boolean>(false)
  const [startingPython, setStartingPython] = useState<boolean>(false)

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/profit-bridge')
        if (res.ok) {
          const data = await res.json()
          setProfitStatus(data.running)
        }
      } catch (e) {}
    }
    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleStartPython = async () => {
    setStartingPython(true)
    try {
      await fetch('/api/profit-bridge', { method: 'POST' })
    } catch (e) {} finally {
      setTimeout(() => setStartingPython(false), 3000)
    }
  }`;

  content = content.replace(
    "export function Sidebar() {",
    "export function Sidebar() {\n" + newStates
  );

  // Replace Bottom Info Section
  const oldBottom = `      {/* Bottom info section */}
      <div className="p-4 mt-auto border-t border-[#1e293b]">
        {!collapsed ? (
          <div className="rounded-xl bg-[#1e293b]/30 p-4 border border-[#1e293b]/50">
             <div className="flex items-center gap-2 mb-2 text-blue-400">
                <Activity size={14} />
                <span className="text-[11px] font-medium uppercase tracking-wider">Servidor Ativo</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Ping local</span>
                <span className="text-xs text-emerald-400 font-mono">12ms</span>
             </div>
          </div>
        ) : (
          <div className="flex justify-center">
             <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          </div>
        )}
      </div>`;

  const newBottom = `      {/* Bottom info section */}
      <div className="p-4 mt-auto border-t border-[#1e293b]">
        {!collapsed ? (
          <div className="rounded-xl bg-[#1e293b]/30 p-4 border border-[#1e293b]/50 flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                   <Activity size={14} />
                   <span className="text-[11px] font-medium uppercase tracking-wider">Ponte Profit</span>
                </div>
                {profitStatus ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                )}
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{profitStatus ? 'Status: Conectado' : 'Status: Offline'}</span>
                <span className="text-xs text-emerald-400 font-mono">{profitStatus ? '12ms' : '0ms'}</span>
             </div>

             {!profitStatus && (
               <button
                 onClick={handleStartPython}
                 disabled={startingPython}
                 className="mt-1 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
               >
                 {startingPython ? (
                   <>
                     <RefreshCw size={12} className="animate-spin" /> Iniciando...
                   </>
                 ) : (
                   <>
                     <Play size={12} /> Ligar Servidor Python
                   </>
                 )}
               </button>
             )}
          </div>
        ) : (
          <div className="flex justify-center">
             <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          </div>
        )}
      </div>`;

  content = content.replace(oldBottom, newBottom);
  fs.writeFileSync(pathStr, content, 'utf8');
}
