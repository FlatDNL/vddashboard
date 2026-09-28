const fs = require('fs');

const pathStr = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

if (!content.includes('profitDdeConnected')) {
  // Add state
  content = content.replace(
    "const [profitStatus, setProfitStatus] = useState<boolean>(false)",
    "const [profitStatus, setProfitStatus] = useState<boolean>(false)\n  const [profitDdeConnected, setProfitDdeConnected] = useState<boolean>(false)"
  );

  // Update effect
  const oldEffect = `  useEffect(() => {
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
  }, [])`;

  const newEffect = `  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/profit-bridge')
        if (res.ok) {
          const data = await res.json()
          setProfitStatus(data.running)
          setProfitDdeConnected(data.profitConnected || false)
        }
      } catch (e) {}
    }
    checkStatus()
    const interval = setInterval(checkStatus, 2000)
    return () => clearInterval(interval)
  }, [])`;

  content = content.replace(oldEffect, newEffect);

  // Update Bottom Info Section Badge
  const oldBadgeSection = `<div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{profitStatus ? 'Status: Conectado' : 'Status: Offline'}</span>
                <span className="text-xs text-emerald-400 font-mono">{profitStatus ? '12ms' : '0ms'}</span>
             </div>`;

  const newBadgeSection = `<div className="flex items-center justify-between my-0.5">
                {profitStatus && profitDdeConnected ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    PROFIT AO VIVO
                  </span>
                ) : profitStatus && !profitDdeConnected ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    ABRA O PROFIT PRO
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                    <RefreshCw size={10} className="animate-spin" />
                    PONTE DESCONECTADA
                  </span>
                )}
                <span className="text-xs text-emerald-400 font-mono">{profitStatus ? '12ms' : '0ms'}</span>
             </div>`;

  content = content.replace(oldBadgeSection, newBadgeSection);
  fs.writeFileSync(pathStr, content, 'utf8');
}
