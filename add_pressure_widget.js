const fs = require('fs');

const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

// I need to add TrendingUp and TrendingDown to lucide-react imports if they aren't there.
if (!content.includes('TrendingUp')) {
  content = content.replace("import { ExternalLink, Clock, Newspaper } from 'lucide-react'", "import { ExternalLink, Clock, Newspaper, TrendingUp, TrendingDown } from 'lucide-react'");
}

const targetContent = `{art.score >= 3 && (
                  <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    ALTO IMPACTO WDO
                  </span>
                )}
                {(art.score === 1 || art.score === 2) && (
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    RELEVANTE
                  </span>
                )}`;

const replacementContent = `{art.wdoPressure === 'ALTA' && (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <TrendingUp size={12} /> ALTA WDO
                  </span>
                )}
                {art.wdoPressure === 'BAIXA' && (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <TrendingDown size={12} /> BAIXA WDO
                  </span>
                )}
                {art.score >= 3 && (
                  <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    ALTO IMPACTO
                  </span>
                )}`;

content = content.replace(targetContent, replacementContent);
fs.writeFileSync(path, content, 'utf8');
