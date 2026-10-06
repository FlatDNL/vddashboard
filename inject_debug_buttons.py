import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'(</table>\s*</div>)'

debug_buttons = '''</table>
                    </div>
                    {/* Botões de Debug */}
                    <div className="flex justify-center gap-2 p-2 bg-[#1c1c1c] border-t border-[#333] shrink-0">
                      <button onClick={testYellow} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-[10px] font-bold uppercase rounded">Test Amarelo</button>
                      <button onClick={testRed} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase rounded">Test Vermelho</button>
                      <button onClick={testModal} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded">Test Modal</button>
                      <button onClick={testReset} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-[10px] font-bold uppercase rounded">Reset</button>
                    </div>'''

content = re.sub(pattern, debug_buttons, content)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
