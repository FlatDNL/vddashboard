const fs = require('fs');

const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetRegex = /\{art\.wdoPressure === 'ALTA'[^]*?ALTO IMPACTO\s*<\/span>\s*\)\}/;

const replacementContent = `<div className="flex flex-col gap-1.5 items-end shrink-0">
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
                    <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <TrendingUp size={12} /> ALTA WDO
                    </span>
                  )}
                  {art.wdoPressure === 'BAIXA' && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <TrendingDown size={12} /> BAIXA WDO
                    </span>
                  )}
                  {art.wdoPressure === 'NEUTRO' && (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
                      NEUTRO
                    </span>
                  )}
                </div>`;

content = content.replace(targetRegex, replacementContent);
fs.writeFileSync(path, content, 'utf8');
