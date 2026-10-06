import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the inner div of the Dollar card using regex
dollar_regex = r'(<div className="p-4 px-6 flex justify-between items-center">\s*<div className="flex items-baseline gap-6">\s*<span className="text-[4-7]xl font-bold text-white tracking-tighter">\s*{fairValue\?.atual \? \(fairValue\.atual / 1000\)\.toFixed\(4\) : \'---\'}\s*</span>\s*<ValChange val={quotes\[\'BRL=X\'\]\?\.changePercent}.*?/>\s*</div>\s*)</div>'

new_dollar_content = r'''\1
                {/* WDO Pressure Button */}
                {risk?.wdo?.action && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-500 mb-1 tracking-widest">PRESSÃO</span>
                    <div className={`px-6 py-2 rounded-[4px] font-bold text-base shadow-sm ${
                       risk.wdo.action.toUpperCase().includes('COMPRA') ? 'bg-[#22c55e] text-[#000000]' : 
                       risk.wdo.action.toUpperCase().includes('VENDA') ? 'bg-[#ef4444] text-white' : 'bg-gray-600 text-white'
                    }`}>
                      {risk.wdo.action.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>'''

content = re.sub(dollar_regex, new_dollar_content, content, flags=re.DOTALL)

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
