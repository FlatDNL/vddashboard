import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to find the exact start of the main return block.
# Let's search for the line with `min-h-screen`.
match = re.search(r'\s*return \(\n\s*<div ref=\{containerRef\} className="min-h-screen', content)
if match:
    start_idx = match.start()
    new_layout = """  return (
    <div ref={containerRef} className="min-h-screen bg-[#111111] text-[#e2e8f0] p-3 font-mono uppercase selection:bg-gray-700 relative group text-sm tracking-tight">
      
      {/* Botão de Tela Cheia (Aparece no Hover) */}
      <div className="absolute top-2 left-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 bg-[#222] hover:bg-[#333] text-gray-300 px-3 py-1.5 rounded border border-[#444] transition-all shadow-xl"
          title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          <span className="text-xs font-semibold">{isFullscreen ? 'SAIR' : 'TELA CHEIA'}</span>
        </button>
      </div>

      {/* Top Bar */}
      <div className="flex flex-col items-center pb-2 mb-3">
        <h1 className="text-2xl font-sans tracking-wide text-white">MACRO DÓLAR — WDO</h1>
        <div className="text-xs text-gray-500 tracking-widest mt-1">
          Tendência | Risco | Fluxo | Notícias | Contexto
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        
        {/* Left Column (col-span-8) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
          
          {/* Top Row: Risco Global / Risco Brasil */}
          <div className="grid grid-cols-2 gap-3">
            {/* Risco Global */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md">
              <div className="text-[11px] text-gray-400 mb-2 flex items-center">
                🌍 RISCO GLOBAL
              </div>
              <div className="flex items-baseline gap-4 mb-2">
                <span className={`text-xl font-bold ${globalScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {risk?.global?.status || 'NEUTRO'} {globalScore > 0 ? '+' : ''}{globalScore.toFixed(0)}
                </span>
                <div className="flex gap-4 text-xs font-mono">
                   <div className="flex gap-1">
                     <span className="text-gray-300">S&P</span>
                     <ValChange val={quotes['^GSPC']?.changePercent} />
                   </div>
                   <div className="flex gap-1">
                     <span className="text-gray-300">DXY</span>
                     <ValChange val={quotes['DX-Y.NYB']?.changePercent} />
                   </div>
                   <div className="flex gap-1">
                     <span className="text-gray-300">UST10Y</span>
                     <ValChange val={quotes['^TNX']?.changePercent} />
                   </div>
                </div>
              </div>
              <div className="border-t border-[#333] w-full mb-2"></div>
              <div className="text-[10px] text-gray-500 tracking-wider">IMPACTO NO DÓLAR</div>
              <RiskBar score={globalScore} status={risk?.global?.status} />
            </div>

            {/* Risco Brasil */}
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md">
              <div className="text-[11px] text-gray-400 mb-2 flex items-center">
                🇧🇷 RISCO BRASIL
              </div>
              <div className="flex items-baseline gap-4 mb-2">
                <span className={`text-xl font-bold ${brazilScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {risk?.brazil?.status || 'NEUTRO'} {brazilScore > 0 ? '+' : ''}{brazilScore.toFixed(0)}
                </span>
                <div className="flex gap-4 text-xs font-mono">
                   <div className="flex gap-1">
                     <span className="text-gray-300">IBOV</span>
                     <ValChange val={quotes['^BVSP']?.changePercent} />
                   </div>
                   <div className="flex gap-1">
                     <span className="text-gray-300">EWZ</span>
                     <ValChange val={quotes['EWZ']?.changePercent} />
                   </div>
                   <div className="flex gap-1">
                     <span className="text-gray-300">DI</span>
                     <ValChange val={undefined} />
                   </div>
                </div>
              </div>
              <div className="border-t border-[#333] w-full mb-2"></div>
              <div className="text-[10px] text-gray-500 tracking-wider">IMPACTO NO DÓLAR</div>
              <RiskBar score={brazilScore} status={risk?.brazil?.status} />
            </div>
          </div>

          {/* Dólar and Participantes */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-[11px] text-gray-400 mb-1 flex items-center gap-1">💵 DÓLAR</div>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold text-white tracking-tighter">
                    {fairValue?.atual ? (fairValue.atual / 1000).toFixed(4) : '---'}
                  </span>
                  <div className="text-2xl">
                    <ValChange val={quotes['BRL=X']?.changePercent} />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-8 text-[13px] font-mono text-right mt-1">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[10px] tracking-widest">JUSTO</span>
                  <span className="text-gray-200">{fairValue?.justo ? formatPts(fairValue.justo) : '---'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[10px] tracking-widest">JUSTÍSSIMO</span>
                  <span className="text-gray-200">{fairValue?.justissimo ? formatPts(fairValue.justissimo) : '---'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[10px] tracking-widest">MÁXIMA</span>
                  <span className="text-gray-200">{fairValue?.maxima ? formatPts(fairValue.maxima) : '---'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[10px] tracking-widest">MÍNIMA</span>
                  <span className="text-gray-200">{fairValue?.minima ? formatPts(fairValue.minima) : '---'}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-[#333] pt-3">
              <div className="text-[10px] text-gray-400 mb-3 tracking-wider">PARTICIPANTES</div>
              <div className="grid grid-cols-3 text-center">
                {aggression.length > 0 ? aggression.map((g, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[13px] text-gray-300">{g.name}</span>
                    <span className={`text-2xl font-normal tracking-tight ${g.value > 0 ? 'text-green-400' : g.value < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {g.value > 0 ? '+' : ''}{g.value.toLocaleString('pt-BR')} {g.value > 0 ? '↑' : g.value < 0 ? '↓' : ''}
                    </span>
                  </div>
                )) : (
                  <>
                    <div className="flex flex-col"><span className="text-[13px] text-gray-300">ESTRANGEIROS</span><span className="text-gray-500 text-2xl font-normal">---</span></div>
                    <div className="flex flex-col"><span className="text-[13px] text-gray-300">BANCOS</span><span className="text-gray-500 text-2xl font-normal">---</span></div>
                    <div className="flex flex-col"><span className="text-[13px] text-gray-300">VAREJO</span><span className="text-gray-500 text-2xl font-normal">---</span></div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Eventos */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex-1">
            <div className="text-[11px] text-gray-400 mb-3 flex items-center">
               📄 EVENTOS DO CALENDÁRIO
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] font-mono">
                <thead>
                  <tr className="text-gray-500 border-b border-[#333]">
                    <th className="py-2 px-1 font-normal w-12">HORA</th>
                    <th className="py-2 px-1 font-normal w-8">PAÍS</th>
                    <th className="py-2 px-1 font-normal">EVENTO</th>
                    <th className="py-2 px-1 font-normal w-16">IMPACTO</th>
                    <th className="py-2 px-1 font-normal w-20 text-center">WDO</th>
                    <th className="py-2 px-1 font-normal text-right">ATUAL</th>
                    <th className="py-2 px-1 font-normal text-right">PROJ.</th>
                    <th className="py-2 px-1 font-normal text-right">ANT.</th>
                  </tr>
                </thead>
                <tbody>
                  {news.map((item, i) => {
                    const isHigh = item.impact === 'HIGH'
                    const isMed = item.impact === 'MEDIUM'
                    const impactText = isHigh ? 'ALTO' : isMed ? 'MÉDIO' : 'BAIXO'
                    const impactColor = isHigh ? 'text-red-400' : isMed ? 'text-yellow-400' : 'text-green-400'
                    
                    const press = item.pressure?.direction
                    const pressText = press === 'ALTA' ? '↑ ALTA' : press === 'BAIXA' ? '↓ BAIXA' : 'NEUTRO'
                    const pressColor = press === 'ALTA' ? 'text-green-400' : press === 'BAIXA' ? 'text-red-400' : 'text-gray-500'

                    return (
                      <tr key={i} className="border-b border-[#222] hover:bg-[#333] transition-colors">
                        <td className="py-2 px-1 text-gray-400">{item.time}</td>
                        <td className="py-2 px-1 text-center">{item.country === 'US' ? '🇺🇸' : item.country === 'BR' ? '🇧🇷' : item.country}</td>
                        <td className="py-2 px-1 text-gray-300 truncate max-w-[200px]" title={item.title}>{item.title}</td>
                        <td className={`py-2 px-1 ${impactColor}`}>{impactText}</td>
                        <td className={`py-2 px-1 text-center font-normal ${pressColor}`}>{pressText}</td>
                        <td className="py-2 px-1 text-right text-gray-200">{item.actual !== '-' ? item.actual : ''}</td>
                        <td className="py-2 px-1 text-right text-gray-500">{item.forecast !== '-' ? item.forecast : ''}</td>
                        <td className="py-2 px-1 text-right text-gray-500">{item.previous !== '-' ? item.previous : ''}</td>
                      </tr>
                    )
                  })}
                  {news.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-gray-600">Nenhum evento no calendário.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (col-span-4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          
          {/* Indicadores Macro */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex-1">
            <div className="text-[11px] text-gray-400 mb-3 flex items-center gap-1">
              📊 INDICADORES MACRO
            </div>
            <div className="space-y-0 text-[13px] font-mono flex flex-col gap-1">
              {[
                { label: 'DXY', sym: 'DX-Y.NYB' },
                { label: 'EUR/USD', sym: 'EURUSD=X' },
                { label: 'USD/JPY', sym: 'JPY=X' },
                { label: 'USD/MXN', sym: 'MXN=X' },
                { label: 'USD/ZAR', sym: 'ZAR=X' },
                { label: 'USD/TRY', sym: 'TRY=X' },
                { label: 'USD/BRL', sym: 'BRL=X' },
                { label: 'S&P', sym: '^GSPC' },
                { label: 'NASDAQ', sym: '^IXIC' },
                { label: 'VIX', sym: '^VIX' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-300 w-24">{row.label}</span>
                  <span className="text-gray-200 flex-1 text-right mr-4">
                    {formatPrice(quotes[row.sym]?.price, row.sym === 'DX-Y.NYB' || row.sym === 'EURUSD=X' || row.sym === '^TNX' ? 3 : 2)}
                  </span>
                  <span className="w-20 text-right">
                    <ValChange val={quotes[row.sym]?.changePercent} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Juros / Commodities */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md">
            <div className="text-[11px] text-gray-400 mb-3 flex items-center gap-1">
              📈 JUROS / COMMODITIES
            </div>
            <div className="space-y-0 text-[13px] font-mono flex flex-col gap-1">
              {[
                { label: 'UST10Y', sym: '^TNX' },
                { label: 'DI1', sym: 'NONE' }, // Unavailable
                { label: 'OIL', sym: 'CL=F' },
                { label: 'GOLD', sym: 'GC=F' },
                { label: 'COPPER', sym: 'HG=F' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-300 w-24">{row.label}</span>
                  <span className="w-20 text-right">
                    <ValChange val={quotes[row.sym]?.changePercent} />
                  </span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Bottom Ticker */}
      <div className="mt-4 bg-[#1c1c1c] border-t border-b border-[#333] flex overflow-hidden whitespace-nowrap py-1.5">
        <div className="animate-[ticker_30s_linear_infinite] flex gap-8 text-[11px] font-mono text-gray-400">
          <span className="flex gap-2">DXY <ValChange val={quotes['DX-Y.NYB']?.changePercent} /></span>
          <span className="flex gap-2">S&P <ValChange val={quotes['^GSPC']?.changePercent} /></span>
          <span className="flex gap-2">NASDAQ <ValChange val={quotes['^IXIC']?.changePercent} /></span>
          <span className="flex gap-2">VIX <ValChange val={quotes['^VIX']?.changePercent} /></span>
          <span className="flex gap-2">WTI OIL <ValChange val={quotes['CL=F']?.changePercent} /></span>
          <span className="flex gap-2">GOLD <ValChange val={quotes['GC=F']?.changePercent} /></span>
          <span className="flex gap-2">COPPER <ValChange val={quotes['HG=F']?.changePercent} /></span>
          <span className="flex gap-2">EUR/USD <ValChange val={quotes['EURUSD=X']?.changePercent} /></span>
          <span className="flex gap-2">USD/BRL <ValChange val={quotes['BRL=X']?.changePercent} /></span>
          
          {/* Duplicate for infinite effect */}
          <span className="flex gap-2">DXY <ValChange val={quotes['DX-Y.NYB']?.changePercent} /></span>
          <span className="flex gap-2">S&P <ValChange val={quotes['^GSPC']?.changePercent} /></span>
          <span className="flex gap-2">NASDAQ <ValChange val={quotes['^IXIC']?.changePercent} /></span>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  )
}
"""

    content = content[:start_idx] + new_layout
    
    # We also need to fix ValChange and RiskBar which were corrupted
    content = content.replace("-", "↗").replace("~", "↘").replace("D\"LAR", "DÓLAR").replace("FORA", "FORÇA").replace("''", "↑").replace("\"", "↓")

    with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("UI replaced successfully")
else:
    print("Could not find start index")
