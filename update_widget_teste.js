const fs = require('fs');
const path = 'src/components/FairValueWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

const typeDefOld = `type PlanilhaData = {
  atual: number
  justo: number
  justissimo: number
  maxima: number
  minima: number
  status: 'COMPRA' | 'VENDA' | 'NEUTRO'
  metrics: {
    dxyPct: number
    emPct: number
  }
}`;

const typeDefNew = `type PlanilhaData = {
  atual: number
  justo: number
  justissimo: number
  maxima: number
  minima: number
  justoTeste?: number
  justissimoTeste?: number
  status: 'COMPRA' | 'VENDA' | 'NEUTRO'
  metrics: {
    dxyPct: number
    emPct: number
  }
}`;

content = content.replace(typeDefOld, typeDefNew);

// Add the two boxes below the Grid (which is inside <div className="grid grid-cols-2 gap-y-4 gap-x-2 relative z-10">...</div>)
// The end of the grid is before: `<div className="mt-4 pt-4 border-t border-[#1e293b] grid grid-cols-2 gap-4">`
const endOfGrid = `<div className="mt-4 pt-4 border-t border-[#1e293b] grid grid-cols-2 gap-4">`;
const testBoxes = `
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
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#1e293b] grid grid-cols-2 gap-4">`;

content = content.replace(endOfGrid, testBoxes);

// Fix height of the widget from h-[270px] or whatever it is, just let it grow or remove fixed height if any
// Actually, let's change `h-[380px]` or `min-h-[380px]` if it exists.
content = content.replace(/h-\[200px\]/g, 'min-h-[200px]');
content = content.replace(/h-\[380px\]/g, 'h-[440px]'); // give it more space
content = content.replace(/h-\[400px\]/g, 'h-[460px]');

fs.writeFileSync(path, content, 'utf8');
