import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix layout container
content = content.replace(
    'className="min-h-screen bg-[#111] text-gray-200 p-2 font-mono uppercase selection:bg-gray-700 relative group"',
    'className="min-h-screen bg-[#121212] text-[#e2e8f0] p-3 font-mono uppercase selection:bg-gray-700 relative group text-sm tracking-tight"'
)

# Fix Gap classes
content = content.replace('gap-2', 'gap-3')
content = content.replace('gap-4 mb-2', 'gap-4 mb-3')
content = content.replace('gap-4 text-xs', 'gap-4 text-sm')

# Fix Cards bg
content = content.replace('bg-[#1a1a1a] border border-gray-700 p-3 rounded', 'bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md')
content = content.replace('bg-[#1a1a1a] border border-gray-700 p-3 rounded flex-1', 'bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex-1')
content = content.replace('bg-[#1a1a1a] border border-gray-700 p-3 rounded flex flex-col justify-between', 'bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex flex-col justify-between')

# Top bar Title
content = re.sub(r'<h1 className="text-xl font-bold tracking-widest text-white">.*</h1>', '<h1 className="text-2xl font-sans font-light tracking-widest text-gray-200">MACRO DÓLAR — WDO</h1>', content)
content = re.sub(r'<div className="text-xs text-gray-500 tracking-wider">\s*Tendência \| Risco \| Fluxo \| Notícias \| Contexto\s*</div>', '<div className="text-xs text-gray-500 tracking-widest mt-1 font-sans">\n          Tendência | Risco | Fluxo | Notícias | Contexto\n        </div>', content)
# Top Bar border removal
content = content.replace('border-b border-gray-700 pb-2 mb-2', 'pb-3 mb-2')

# Dollar Box
content = re.sub(r'<span className="text-4xl font-bold text-white">', '<span className="text-5xl font-bold text-white tracking-tighter">', content)

# Remove borders from indicators
content = content.replace('border-b border-gray-800 pb-1', '')

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
