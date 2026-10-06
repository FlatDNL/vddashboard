import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the inner structure of PREÇO / NÍVEIS
old_preco = '''              <div className="p-5 pt-4">
                <div className="flex flex-col gap-4 text-xl font-bold font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-normal">JUSTO</span>
                    <span className="text-white">{fairValue?.justo ? fairValue.justo.toFixed(1) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-normal text-lg">JUSTÍSSIMO</span>
                    <span className="text-white">{fairValue?.justissimo ? fairValue.justissimo.toFixed(1) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-normal">MÁXIMA</span>
                    <span className="text-[#ef4444]">{fairValue?.maxima ? fairValue.maxima.toFixed(1) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-normal">MÍNIMA</span>
                    <span className="text-[#22c55e]">{fairValue?.minima ? fairValue.minima.toFixed(1) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#333]">
                    <span className="text-gray-400 font-normal">AGRESSÃO</span>
                    <span className={aggression > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                      {aggression > 0 ? '+' : ''}{aggression.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>'''

new_preco = '''              <div className="p-3 xl:p-5 pt-4">
                <div className="flex flex-col gap-4 text-lg xl:text-xl font-bold font-mono">
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-gray-400 font-normal">JUSTO</span>
                    <span className="text-white shrink-0">{fairValue?.justo ? fairValue.justo.toFixed(1) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-gray-400 font-normal text-base xl:text-lg">JUSTÍSSIMO</span>
                    <span className="text-white shrink-0">{fairValue?.justissimo ? fairValue.justissimo.toFixed(1) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-gray-400 font-normal">MÁXIMA</span>
                    <span className="text-[#ef4444] shrink-0">{fairValue?.maxima ? fairValue.maxima.toFixed(1) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-gray-400 font-normal">MÍNIMA</span>
                    <span className="text-[#22c55e] shrink-0">{fairValue?.minima ? fairValue.minima.toFixed(1) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#333] gap-1">
                    <span className="text-gray-400 font-normal">AGRESSÃO</span>
                    <span className={`shrink-0 ${aggression > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      {aggression > 0 ? '+' : ''}{aggression.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>'''

content = content.replace(old_preco, new_preco)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
