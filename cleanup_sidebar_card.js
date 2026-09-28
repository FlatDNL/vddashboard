const fs = require('fs');

const pathStr = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

const newBottomSection = `      {/* Bottom info section */}
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
             <div className="flex items-center justify-between my-0.5">
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
             </div>
          </div>
        ) : (
          <div className="flex justify-center">
             <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          </div>
        )}
      </div>`;

// Replace bottom section
const sectionRegex = /\{\/\* Bottom info section \*\/\}[^]*?<\/div>\s*<\/div>/;
content = content.replace(sectionRegex, newBottomSection);

// Clean unused states and handlers
content = content.replace("const [startingPython, setStartingPython] = useState<boolean>(false)", "");
content = content.replace(/const handleStopPython = async \(\) => \{[^]*?\}\s*\}\s*const handleStartPython = async \(\) => \{[^]*?\}\s*\}/, "");

fs.writeFileSync(pathStr, content, 'utf8');
