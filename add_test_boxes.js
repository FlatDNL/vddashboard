const fs = require('fs');
const path = 'src/components/FairValueWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetGridEnd = `        {/* Coluna 2 - Linha 2: MÍNIMA */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[10px] text-green-400 font-medium mb-1">MÍNIMA (Suporte)</span>
          <span className="text-lg font-bold text-slate-200">{formatPts(data.minima)}</span>
        </div>
      </div>`;

// Fallback search with generic regex to handle weird characters in MÍNIMA
const targetRegex = /\{\/\* Coluna 2 - Linha 2: [^]*?<\/div>\s*<\/div>/;

const testBoxes = `        {/* Coluna 2 - Linha 2: MÍNIMA */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[10px] text-green-400 font-medium mb-1">MÍNIMA (Suporte)</span>
          <span className="text-lg font-bold text-slate-200">{formatPts(data.minima)}</span>
        </div>
      </div>

      {/* Grid de TESTE (08:50) */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#1e293b]/50 relative z-10">
        <div className="bg-[#0b1120] border border-blue-500/20 rounded-lg p-3 flex flex-col items-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <span className="text-[10px] text-blue-400 font-medium mb-1">JUSTO (Teste 08:50)</span>
          <span className="text-lg font-bold text-blue-300">{data.justoTeste ? formatPts(data.justoTeste) : '---'}</span>
        </div>
        <div className="bg-[#0b1120] border border-blue-500/20 rounded-lg p-3 flex flex-col items-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <span className="text-[10px] text-blue-400 font-medium mb-1">JUSTÍSSIMO (Teste)</span>
          <span className="text-lg font-bold text-blue-300">{data.justissimoTeste ? formatPts(data.justissimoTeste) : '---'}</span>
        </div>
      </div>`;

content = content.replace(targetRegex, testBoxes);
fs.writeFileSync(path, content, 'utf8');
