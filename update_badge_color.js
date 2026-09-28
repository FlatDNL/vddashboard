const fs = require('fs');
const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetBaixa = `<span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <TrendingDown size={12} /> BAIXA WDO
                      </span>`;

const replaceBaixa = `<span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        <TrendingDown size={12} /> BAIXA WDO
                      </span>`;

content = content.replace(targetBaixa, replaceBaixa);
fs.writeFileSync(path, content, 'utf8');
