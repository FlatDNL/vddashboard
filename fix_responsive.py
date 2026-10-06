import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Risco Global
content = content.replace(
'''              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${globalScore > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {risk?.global?.status || 'NEUTRO'} {globalScore > 0 ? '+' : ''}{globalScore.toFixed(0)}
                </span>
                <div className="flex gap-6 text-base font-mono">
                   <div className="flex gap-2 items-center">
                     <span className="text-gray-300">S&P</span>
                     <ValChange val={quotes['^GSPC']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center">
                     <span className="text-gray-300">DXY</span>
                     <ValChange val={quotes['DX-Y.NYB']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center">
                     <span className="text-gray-300">UST10Y</span>
                     <ValChange val={quotes['^TNX']?.changePercent} />
                   </div>
                </div>
              </div>''',
'''              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${globalScore > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {risk?.global?.status || 'NEUTRO'} {globalScore > 0 ? '+' : ''}{globalScore.toFixed(0)}
                </span>
                <div className="flex flex-col xl:flex-row gap-1 xl:gap-6 text-base font-mono items-end xl:items-center">
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">S&P</span>
                     <ValChange val={quotes['^GSPC']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">DXY</span>
                     <ValChange val={quotes['DX-Y.NYB']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">UST10Y</span>
                     <ValChange val={quotes['^TNX']?.changePercent} />
                   </div>
                </div>
              </div>'''
)

# Fix Risco Brasil
content = content.replace(
'''              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${brazilScore > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {risk?.brazil?.status || 'NEUTRO'} {brazilScore > 0 ? '+' : ''}{brazilScore.toFixed(0)}
                </span>
                <div className="flex gap-6 text-base font-mono">
                   <div className="flex gap-2 items-center">
                     <span className="text-gray-300">IBOV</span>
                     <ValChange val={quotes['^BVSP']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center">
                     <span className="text-gray-300">EWZ</span>
                     <ValChange val={quotes['EWZ']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center">
                     <span className="text-gray-300">DI</span>
                     <ValChange val={undefined} />
                   </div>
                </div>
              </div>''',
'''              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${brazilScore > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {risk?.brazil?.status || 'NEUTRO'} {brazilScore > 0 ? '+' : ''}{brazilScore.toFixed(0)}
                </span>
                <div className="flex flex-col xl:flex-row gap-1 xl:gap-6 text-base font-mono items-end xl:items-center">
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">IBOV</span>
                     <ValChange val={quotes['^BVSP']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">EWZ</span>
                     <ValChange val={quotes['EWZ']?.changePercent} />
                   </div>
                   <div className="flex gap-2 items-center justify-end w-full">
                     <span className="text-gray-300">DI</span>
                     <ValChange val={undefined} />
                   </div>
                </div>
              </div>'''
)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
