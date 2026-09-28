const fs = require('fs');

const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetContent = `{/* ABA 2: Manchetes Financeiras de Última Hora */}
        {activeTab === 'MARKET_NEWS' && (
          <div className="grid grid-cols-1 gap-3">
            {articles.map((art) => (
              <a
                key={art.id}
                href={art.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0b1120] rounded-xl border border-[#1e293b] p-4 flex items-center justify-between gap-4 hover:border-blue-500/40 hover:bg-[#1e293b]/20 transition-all group"
              >
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {art.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{art.publisher}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(art.providerPublishTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-[#0f172a] rounded-lg border border-[#1e293b] text-slate-400 group-hover:text-blue-400 transition-colors shrink-0">
                  <ExternalLink size={16} />
                </div>
              </a>
            ))}`;

const replacementContent = `{/* ABA 2: Manchetes Financeiras de Última Hora */}
        {activeTab === 'MARKET_NEWS' && (
          <div className="grid grid-cols-1 gap-3">
            {articles.map((art: any) => (
              <a
                key={art.id}
                href={art.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0b1120] rounded-xl border border-[#1e293b] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-500/40 hover:bg-[#1e293b]/20 transition-all group"
              >
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors leading-relaxed">
                      {art.title}
                    </h4>
                    {art.score >= 3 && (
                      <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        ALTO IMPACTO WDO
                      </span>
                    )}
                    {(art.score === 1 || art.score === 2) && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        RELEVANTE
                      </span>
                    )}
                  </div>
                  
                  {art.summary && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-between w-full mt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md font-medium">{art.publisher}</span>
                      <span>•</span>
                      <span className="font-mono flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(art.providerPublishTime).toLocaleDateString('pt-BR')} às {new Date(art.providerPublishTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="p-1.5 bg-[#0f172a] rounded-md border border-[#1e293b] text-slate-400 group-hover:text-blue-400 transition-colors shrink-0">
                      <ExternalLink size={14} />
                    </div>
                  </div>
                </div>
              </a>
            ))}`;

// Handle character encodings correctly by doing indexof or basic replace with normalized strings
const idx = content.indexOf('{/* ABA 2: Manchetes Financeiras');
if (idx === -1) {
  console.log("Could not find the target content using indexOf. Please check the file manually.");
} else {
  // Try to use a simpler replace
  const startIdx = content.indexOf("{/* ABA 2: Manchetes");
  const endIdx = content.indexOf("            {articles.length === 0 && (");
  if(startIdx !== -1 && endIdx !== -1) {
      content = content.substring(0, startIdx) + replacementContent + "\n" + content.substring(endIdx);
      fs.writeFileSync(path, content, 'utf8');
      console.log("Successfully replaced content.");
  }
}
