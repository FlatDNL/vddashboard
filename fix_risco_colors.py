import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Risco Global color logic
old_global = '''                <span className={`text-2xl font-bold ${globalScore > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {risk?.global?.status || 'NEUTRO'} {globalScore > 0 ? '+' : ''}{globalScore.toFixed(0)}
                </span>'''

new_global = '''                <span className={`text-2xl font-bold ${
                  risk?.global?.status?.toUpperCase() === 'RISK ON' ? 'text-[#22c55e]' : 
                  risk?.global?.status?.toUpperCase() === 'RISK OFF' ? 'text-[#ef4444]' : 'text-yellow-500'
                }`}>
                  {risk?.global?.status || 'NEUTRO'} {globalScore > 0 ? '+' : ''}{globalScore.toFixed(0)}
                </span>'''

content = content.replace(old_global, new_global)

# Replace Risco Brasil color logic
old_brazil = '''                <span className={`text-2xl font-bold ${brazilScore > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {risk?.brazil?.status || 'NEUTRO'} {brazilScore > 0 ? '+' : ''}{brazilScore.toFixed(0)}
                </span>'''

new_brazil = '''                <span className={`text-2xl font-bold ${
                  risk?.brazil?.status?.toUpperCase() === 'RISK ON' ? 'text-[#22c55e]' : 
                  risk?.brazil?.status?.toUpperCase() === 'RISK OFF' ? 'text-[#ef4444]' : 'text-yellow-500'
                }`}>
                  {risk?.brazil?.status || 'NEUTRO'} {brazilScore > 0 ? '+' : ''}{brazilScore.toFixed(0)}
                </span>'''

content = content.replace(old_brazil, new_brazil)


with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
