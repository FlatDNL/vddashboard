const fs = require('fs');

const pathStr = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

if (!content.includes('handleStopPython')) {
  // Add Square to lucide-react imports
  content = content.replace(
    "  Play,",
    "  Play,\n  Square,"
  );

  // Add handleStopPython function
  const handleStopCode = `  const handleStopPython = async () => {
    setStartingPython(true)
    try {
      await fetch('/api/profit-bridge', { method: 'DELETE' })
      setProfitStatus(false)
    } catch (e) {} finally {
      setTimeout(() => setStartingPython(false), 2000)
    }
  }`;

  content = content.replace(
    "const handleStartPython =",
    handleStopCode + "\n\n  const handleStartPython ="
  );

  // Replace button logic in JSX
  const oldButtonJsx = `             {!profitStatus && (
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
             )}`;

  const newButtonJsx = `             {profitStatus ? (
               <button
                 onClick={handleStopPython}
                 disabled={startingPython}
                 className="mt-1 w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
               >
                 {startingPython ? (
                   <>
                     <RefreshCw size={12} className="animate-spin" /> Desligando...
                   </>
                 ) : (
                   <>
                     <Square size={12} /> Desligar Servidor
                   </>
                 )}
               </button>
             ) : (
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
             )}`;

  content = content.replace(oldButtonJsx, newButtonJsx);
  fs.writeFileSync(pathStr, content, 'utf8');
}
