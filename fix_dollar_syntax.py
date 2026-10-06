import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Instead of complex regex, let's just find the start of the Dollar card and the start of Participantes card, and replace everything in between.
start_marker = r'\{/\* ROW 2: Dólar \(Now inside left col\) \*/\}'
end_marker = r'\{/\* Participantes \*/\}'

match = re.search(f'({start_marker}.*?)({end_marker})', content, re.DOTALL)

if match:
    new_dollar = '''{/* ROW 2: Dólar (Now inside left col) */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col overflow-hidden shrink-0">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                💵 DÓLAR
              </div>
              <div className="p-4 px-6 flex justify-between items-center">
                <div className="flex items-baseline gap-6">
                  <span className="text-6xl font-bold text-white tracking-tighter">
                    {fairValue?.atual ? (fairValue.atual / 1000).toFixed(4) : '---'}
                  </span>
                  <ValChange val={quotes['BRL=X']?.changePercent} big />
                </div>
                {/* WDO Pressure Button (Massive) */}
                {risk?.wdo?.action && (
                  <div className={`px-10 py-3 rounded-md font-black text-4xl shadow-md tracking-wider ${
                     risk.wdo.action.toUpperCase().includes('COMPRA') ? 'bg-[#22c55e] text-white' : 
                     risk.wdo.action.toUpperCase().includes('VENDA') ? 'bg-[#ef4444] text-white' : 'bg-[#333333] text-gray-400'
                  }`}>
                    {risk.wdo.action.toUpperCase().includes('COMPRA') ? 'COMPRA' : 
                     risk.wdo.action.toUpperCase().includes('VENDA') ? 'VENDA' : 'NEUTRO'}
                  </div>
                )}
              </div>
            </div>

            '''
    
    content = content[:match.start()] + new_dollar + match.group(2) + content[match.end():]

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
