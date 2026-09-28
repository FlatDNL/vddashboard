const fs = require('fs');
const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetAlta = `{art.wdoPressure === 'ALTA' && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {art.analysisType === 'AI' ? <Sparkles size={10} className="text-purple-400" /> : <Hash size={10} className="text-emerald-500/60" />} <TrendingUp size={12} /> ALTA WDO
                    </span>
                  )}`;

const replaceAlta = `{art.wdoPressure === 'ALTA' && (
                    <div className="flex items-center gap-1.5">
                      {art.analysisType === 'AI' ? <Sparkles size={12} className="text-purple-400" /> : <Hash size={12} className="text-slate-500" />}
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <TrendingUp size={12} /> ALTA WDO
                      </span>
                    </div>
                  )}`;

const targetBaixa = `{art.wdoPressure === 'BAIXA' && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {art.analysisType === 'AI' ? <Sparkles size={10} className="text-purple-400" /> : <Hash size={10} className="text-emerald-500/60" />} <TrendingDown size={12} /> BAIXA WDO
                    </span>
                  )}`;

const replaceBaixa = `{art.wdoPressure === 'BAIXA' && (
                    <div className="flex items-center gap-1.5">
                      {art.analysisType === 'AI' ? <Sparkles size={12} className="text-purple-400" /> : <Hash size={12} className="text-slate-500" />}
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <TrendingDown size={12} /> BAIXA WDO
                      </span>
                    </div>
                  )}`;

const targetNeutro = `{art.wdoPressure === 'NEUTRO' && (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
                      {art.analysisType === 'AI' ? <Sparkles size={10} className="text-purple-400" /> : <Hash size={10} className="text-slate-500/60" />} NEUTRO
                    </span>
                  )}`;

const replaceNeutro = `{art.wdoPressure === 'NEUTRO' && (
                    <div className="flex items-center gap-1.5">
                      {art.analysisType === 'AI' ? <Sparkles size={12} className="text-purple-400" /> : <Hash size={12} className="text-slate-500" />}
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        NEUTRO
                      </span>
                    </div>
                  )}`;

content = content.replace(targetAlta, replaceAlta);
content = content.replace(targetBaixa, replaceBaixa);
content = content.replace(targetNeutro, replaceNeutro);

fs.writeFileSync(path, content, 'utf8');
