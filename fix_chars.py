import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix mangled characters
content = content.replace('D"LAR', 'DÓLAR')
content = content.replace('MACRO DÓLAR ?" WDO', 'MACRO DÓLAR — WDO')
content = content.replace('TendǦncia', 'Tendência')
content = content.replace('Notcias', 'Notícias')

content = content.replace('YO? RISCO GLOBAL', '🌍 RISCO GLOBAL')
content = content.replace('YY RISCO BRASIL', '🇧🇷 RISCO BRASIL')
content = content.replace('Y\' DÓLAR', '💵 DÓLAR')
content = content.replace('Y"" EVENTOS DO CALEND?RIO', '📄 EVENTOS DO CALENDÁRIO')
content = content.replace('Y"S INDICADORES MACRO', '📊 INDICADORES MACRO')
content = content.replace('Y"^ JUROS / COMMODITIES', '📈 JUROS / COMMODITIES')

content = content.replace('PA?S', 'PAÍS')
content = content.replace('M?XIMA', 'MÁXIMA')
content = content.replace('M?NIMA', 'MÍNIMA')
content = content.replace('JUST?SSIMO', 'JUSTÍSSIMO')
content = content.replace('FORA', 'FORÇA')

content = content.replace('-', '↗')
content = content.replace('~', '↘')
content = content.replace('\'', '↑')

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
