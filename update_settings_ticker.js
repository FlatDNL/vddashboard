const fs = require('fs');

const pathStr = 'src/app/dashboard/configuracoes/page.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

if (!content.includes('profitTicker')) {
  // Add state
  content = content.replace("const [geminiKey, setGeminiKey] = useState('')", "const [geminiKey, setGeminiKey] = useState('')\n  const [profitTicker, setProfitTicker] = useState('WDOZ26')");
  
  // Update useEffect
  const oldUseEffect = `useEffect(() => {
    const key = localStorage.getItem('gemini_api_key')
    if (key) setGeminiKey(key)
  }, [])`;

  const newUseEffect = `useEffect(() => {
    const key = localStorage.getItem('gemini_api_key')
    if (key) setGeminiKey(key)
    
    const ticker = localStorage.getItem('profit_ticker')
    if (ticker) setProfitTicker(ticker)
  }, [])`;

  content = content.replace(oldUseEffect, newUseEffect);

  // Update handleSave
  const oldHandleSave = `const handleSave = () => {
    localStorage.setItem('gemini_api_key', geminiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }`;

  const newHandleSave = `const handleSave = () => {
    localStorage.setItem('gemini_api_key', geminiKey)
    localStorage.setItem('profit_ticker', profitTicker)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }`;

  content = content.replace(oldHandleSave, newHandleSave);

  // Add the Profit Pro block
  // Replace the closing `</div>` of the grid to insert a new block
  const oldGridClose = `        </div>
      </div>
    </div>
  )
}`;

  const newProfitBlock = `        </div>
        
        {/* Bloco do Profit Pro */}
        <div className="bg-[#0f172a] p-6 rounded-2xl border border-[#1e293b] flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Bot className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Integração Profit Pro</h2>
              <p className="text-xs text-slate-400">Ativo para envio de dados em Tempo Real na Régua.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Key size={14} className="text-slate-400" /> Cógido do Contrato WDO
            </label>
            <input
              type="text"
              placeholder="Ex: WDOZ26"
              value={profitTicker}
              onChange={(e) => setProfitTicker(e.target.value)}
              className="w-full bg-[#0b1120] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600 uppercase"
            />
            <p className="text-xs text-slate-500 mt-1">
              Coloque o contrato de mini dólar atual. Este valor será enviado automaticamente para o script Python "profit_bridge.py".
            </p>
          </div>

          <div className="mt-2 flex">
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
          </div>
        </div>

      </div>
    </div>
  )
}`;

  content = content.replace(oldGridClose, newProfitBlock);
  fs.writeFileSync(pathStr, content, 'utf8');
}
