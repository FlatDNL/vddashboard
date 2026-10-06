import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace RiskBar definition
new_risk_bar = '''  const RiskBar = ({ score, status }: { score: number, status: string }) => {
    const pct = Math.max(0, Math.min(100, (score + 100) / 2))
    const isRiskOn = status === 'RISK ON' || score > 0
    const color = isRiskOn ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
    const arrowColor = isRiskOn ? 'text-[#ef4444]' : 'text-[#22c55e]'
    return (
      <div className="flex justify-between items-end w-full text-sm font-mono text-gray-400">
        <div className="flex flex-col">
          <span className="text-gray-500 mb-1">IMPACTO NO DÓLAR</span>
          <span className="text-gray-200">DÓLAR <span className={arrowColor}>{isRiskOn ? '↓' : '↑'}</span></span>
        </div>
        <div className="flex items-center gap-2 mb-0.5">
          <span>FORÇA</span>
          <div className="w-32 h-2.5 flex gap-[2px]">
            {Array.from({ length: 10 }).map((_, i) => (
               <div key={i} className={`h-full flex-1 ${i < (pct / 10) ? color : 'bg-[#333]'}`} />
            ))}
          </div>
          <span className="w-8 text-right text-gray-200">{pct.toFixed(0)}%</span>
        </div>
      </div>
    )
  }'''

content = re.sub(
    r'const RiskBar = \(\{ score, status \}: \{ score: number, status: string \}\) => \{.*?\n  \}',
    new_risk_bar,
    content,
    flags=re.DOTALL
)

# Remove the duplicated IMPACTO NO DÓLAR strings before the component
content = content.replace(
'''            <div className="text-sm text-gray-500 mb-1">IMPACTO NO DÓLAR</div>
            <RiskBar score={globalScore} status={risk?.global?.status} />''',
'''            <RiskBar score={globalScore} status={risk?.global?.status} />'''
)

content = content.replace(
'''            <div className="text-sm text-gray-500 mb-1">IMPACTO NO DÓLAR</div>
            <RiskBar score={brazilScore} status={risk?.brazil?.status} />''',
'''            <RiskBar score={brazilScore} status={risk?.brazil?.status} />'''
)


with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
