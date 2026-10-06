import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the inner div of the Dollar card
old_dollar_content = '''              <div className="p-4 px-6 flex justify-between items-center">
                <div className="flex items-baseline gap-6">
                  <span className="text-5xl font-bold text-white tracking-tighter">
                    {fairValue?.atual ? (fairValue.atual / 1000).toFixed(4) : '---'}
                  </span>
                  <ValChange val={quotes['BRL=X']?.changePercent}  />
                </div>
              </div>'''

new_dollar_content = '''              <div className="p-4 px-6 flex justify-between items-center">
                <div className="flex items-baseline gap-6">
                  <span className="text-5xl font-bold text-white tracking-tighter">
                    {fairValue?.atual ? (fairValue.atual / 1000).toFixed(4) : '---'}
                  </span>
                  <ValChange val={quotes['BRL=X']?.changePercent}  />
                </div>
                {/* WDO Pressure Button */}
                {risk?.wdo?.action && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1 tracking-widest">PRESSÃO</span>
                    <div className={`px-6 py-2 rounded-[4px] font-bold text-base shadow-sm ${
                       risk.wdo.action.toUpperCase().includes('COMPRA') ? 'bg-[#22c55e] text-[#000000]' : 
                       risk.wdo.action.toUpperCase().includes('VENDA') ? 'bg-[#ef4444] text-white' : 'bg-gray-600 text-white'
                    }`}>
                      {risk.wdo.action.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>'''

content = content.replace(old_dollar_content, new_dollar_content)

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
