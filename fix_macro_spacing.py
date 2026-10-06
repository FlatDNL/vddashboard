import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Indicadores Macro
content = content.replace(
'''            {/* Indicadores Macro */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                📊 INDICADORES MACRO
              </div>
              <div className="p-5 pt-3 overflow-y-auto flex-1">
                <div className="flex flex-col gap-2 text-base font-mono">''',
'''            {/* Indicadores Macro */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                📊 INDICADORES MACRO
              </div>
              <div className="p-3 overflow-y-hidden flex-1 flex flex-col justify-center">
                <div className="flex flex-col gap-[2px] text-base font-mono leading-none">'''
)

content = content.replace(
'''                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-1">''',
'''                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">'''
)

# Fix Juros / Commodities
content = content.replace(
'''            {/* Juros / Commodities */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md shrink-0 overflow-hidden flex flex-col">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                📈 JUROS / COMMODITIES
              </div>
              <div className="p-5 pt-3">
                <div className="flex flex-col gap-3 text-base font-mono">''',
'''            {/* Juros / Commodities */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md shrink-0 overflow-hidden flex flex-col">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                📈 JUROS / COMMODITIES
              </div>
              <div className="p-3">
                <div className="flex flex-col gap-1 text-base font-mono leading-none">'''
)


with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
