import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_btn = '''      {/* Botão de Tela Cheia */}
      <div className="absolute top-4 left-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">'''

new_btn = '''      {/* Botão de Tela Cheia */}
      <div className="absolute top-4 left-4 z-50 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity duration-300">'''

content = content.replace(old_btn, new_btn)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
