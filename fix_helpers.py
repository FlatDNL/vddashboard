import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-16') as f:
    content = f.read()

# I will replace the ValChange and RiskBar functions completely by regex matching the function bodies
content = re.sub(
    r'const ValChange = .*?return \(\s*<span className=\{`inline-flex.*?\n\s*</span>\n\s*\)\n\s*\}',
    '''const ValChange = ({ val }: { val: number | undefined }) => {
    if (val === undefined) return <span className="text-gray-500">---</span>
    const color = val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-gray-400'
    const icon = val > 0 ? '↗' : val < 0 ? '↘' : ''
    return (
      <span className={`inline-flex items-center ${color} font-mono text-sm tracking-tight`}>
        {formatPct(val)} {icon}
      </span>
    )
  }''',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'const RiskBar = .*?return \(\s*<div className="flex items-center mt-1.*?\n\s*</div>\n\s*\)\n\s*\}',
    '''const RiskBar = ({ score, status }: { score: number, status: string }) => {
    const pct = Math.max(0, Math.min(100, (score + 100) / 2))
    const isRiskOn = status === 'RISK ON' || score > 0
    const color = isRiskOn ? 'bg-green-400' : 'bg-red-400'
    return (
      <div className="flex items-center mt-1 w-full text-[10px] font-mono text-gray-400 tracking-wider">
        <span className="w-16">DÓLAR {isRiskOn ? '↓' : '↑'}</span>
        <span className="mr-2">FORÇA</span>
        <div className="flex-1 h-3 flex gap-[2px]">
          {Array.from({ length: 10 }).map((_, i) => (
             <div key={i} className={`h-full flex-1 ${i < (pct / 10) ? color : 'bg-[#333]'}`} />
          ))}
        </div>
        <span className="ml-2 w-8 text-right">{pct.toFixed(0)}%</span>
      </div>
    )
  }''',
    content,
    flags=re.DOTALL
)

# And now fix the main layout text that was corrupted
content = content.replace('D\u00d3LAR', 'DÓLAR') # Fix already correct? Actually wait, PowerShell outputs weird characters.
content = content.replace('D\ufffdLAR', 'DÓLAR')
content = content.replace('MACRO D\ufffdLAR \ufffd?" WDO', 'MACRO DÓLAR — WDO')
content = content.replace('Tend\ufffdncia | Risco | Fluxo | Not\ufffdcias | Contexto', 'Tendência | Risco | Fluxo | Notícias | Contexto')
content = content.replace('\ufffdYO? RISCO GLOBAL', '🌍 RISCO GLOBAL')
content = content.replace('\ufffdY\ufffdY\ufffd RISCO BRASIL', '🇧🇷 RISCO BRASIL')
content = content.replace('\ufffdY\'\ufffd D\ufffdLAR', '💵 DÓLAR')
content = content.replace('\ufffdY"" EVENTOS DO CALEND\ufffdRIO', '📄 EVENTOS DO CALENDÁRIO')
content = content.replace('\ufffdY"S INDICADORES MACRO', '📊 INDICADORES MACRO')
content = content.replace('\ufffdY"^ JUROS / COMMODITIES', '📈 JUROS / COMMODITIES')
content = content.replace('PA\ufffdS', 'PAÍS')
content = content.replace('M\ufffdXIMA', 'MÁXIMA')
content = content.replace('M\ufffdNIMA', 'MÍNIMA')
content = content.replace('JUST\ufffdSSIMO', 'JUSTÍSSIMO')

# Save as UTF-8 so node handles it!
with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
