import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the inner div of the Dollar card using regex
dollar_regex = r'(<div className="p-4 px-6 flex justify-between items-center">\s*<div className="flex items-baseline gap-6">\s*<span className="text-6xl font-bold text-white tracking-tighter">\s*{fairValue\?.atual \? \(fairValue\.atual / 1000\)\.toFixed\(4\) : \'---\'}\s*</span>\s*<ValChange val={quotes\[\'BRL=X\'\]\?\.changePercent} big />\s*</div>\s*).*?</div>'

new_dollar_content = r'''\1
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
              </div>'''

content = re.sub(dollar_regex, new_dollar_content, content, flags=re.DOTALL)

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
