import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the fallback color with yellow
old_logic = '''                     risk.wdo.action.toUpperCase().includes('VENDA') ? 'bg-[#ef4444] text-white' : 'bg-[#333333] text-gray-400'
                  }`}>'''

new_logic = '''                     risk.wdo.action.toUpperCase().includes('VENDA') ? 'bg-[#ef4444] text-white' : 'bg-yellow-500 text-black'
                  }`}>'''

content = content.replace(old_logic, new_logic)

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
