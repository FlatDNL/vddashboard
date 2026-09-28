const fs = require('fs');

const pathStr = 'src/app/dashboard/configuracoes/page.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

if (!content.includes('download-bridge')) {
  // Add Download to lucide-react imports
  content = content.replace(
    "import { Save, Key, CheckCircle, Bot, Play, XCircle } from 'lucide-react'",
    "import { Save, Key, CheckCircle, Bot, Play, XCircle, Download } from 'lucide-react'"
  );

  // Replace button container
  const oldButtonContainer = `<div className="mt-2 flex">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle size={16} /> Salvo!
                </>
              ) : (
                <>
                  <Save size={16} /> Salvar Integração
                </>
              )}
            </button>
          </div>`;

  const newButtonContainer = `<div className="mt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle size={16} /> Salvo!
                </>
              ) : (
                <>
                  <Save size={16} /> Salvar Integração
                </>
              )}
            </button>

            <a
              href="/api/download-bridge"
              download="profit_bridge.py"
              className="flex-1 px-6 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-slate-200 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-[#334155]"
            >
              <Download size={16} className="text-blue-400" /> Baixar Script Ponte (.py)
            </a>
          </div>`;

  content = content.replace(oldButtonContainer, newButtonContainer);
  fs.writeFileSync(pathStr, content, 'utf8');
}
