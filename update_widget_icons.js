const fs = require('fs');
const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('Sparkles')) {
  content = content.replace("import { ExternalLink, Clock, Newspaper, TrendingUp, TrendingDown }", "import { ExternalLink, Clock, Newspaper, TrendingUp, TrendingDown, Hash, Sparkles }");
}

const targetAlta = `<TrendingUp size={12} /> ALTA WDO`;
const replaceAlta = `{art.analysisType === 'AI' ? <Sparkles size={10} className="text-purple-400" /> : <Hash size={10} className="text-emerald-500/60" />} <TrendingUp size={12} /> ALTA WDO`;

const targetBaixa = `<TrendingDown size={12} /> BAIXA WDO`;
const replaceBaixa = `{art.analysisType === 'AI' ? <Sparkles size={10} className="text-purple-400" /> : <Hash size={10} className="text-emerald-500/60" />} <TrendingDown size={12} /> BAIXA WDO`;

const targetNeutro = `NEUTRO
                    </span>`;
const replaceNeutro = `{art.analysisType === 'AI' ? <Sparkles size={10} className="text-purple-400" /> : <Hash size={10} className="text-slate-500/60" />} NEUTRO
                    </span>`;

content = content.replace(targetAlta, replaceAlta);
content = content.replace(targetBaixa, replaceBaixa);
content = content.replace(targetNeutro, replaceNeutro);

fs.writeFileSync(path, content, 'utf8');
