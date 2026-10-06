import re

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Risco Global
content = content.replace(
'''          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-5 rounded-md flex flex-col justify-center">
            <div className="text-base text-gray-400 mb-3 font-bold flex items-center">
              🌍 RISCO GLOBAL
            </div>''',
'''          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col justify-center overflow-hidden">
            <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center shrink-0">
              🌍 RISCO GLOBAL
            </div>
            <div className="p-5 flex flex-col justify-center flex-1">'''
).replace(
'''            <RiskBar score={globalScore} status={risk?.global?.status} />
          </div>''',
'''            <RiskBar score={globalScore} status={risk?.global?.status} />
            </div>
          </div>'''
)

# Risco Brasil
content = content.replace(
'''          <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-5 rounded-md flex flex-col justify-center">
            <div className="text-base text-gray-400 mb-3 font-bold flex items-center">
              🇧🇷 RISCO BRASIL
            </div>''',
'''          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col justify-center overflow-hidden">
            <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center shrink-0">
              🇧🇷 RISCO BRASIL
            </div>
            <div className="p-5 flex flex-col justify-center flex-1">'''
).replace(
'''            <RiskBar score={brazilScore} status={risk?.brazil?.status} />
          </div>''',
'''            <RiskBar score={brazilScore} status={risk?.brazil?.status} />
            </div>
          </div>'''
)

# Dólar (Wait, does Dollar have a title bar? In the reference image from previous turn, it just says DÓLAR. I'll make it consistent).
content = content.replace(
'''        <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-6 rounded-md flex justify-between items-center shrink-0">
          <div className="text-base text-gray-400 font-bold flex items-center gap-2">💵 DÓLAR</div>''',
'''        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col overflow-hidden shrink-0">
          <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2">
            💵 DÓLAR
          </div>
          <div className="p-6 flex justify-between items-center">'''
).replace(
'''          {/* Espaçador invisível para centralizar o preço se quisermos, mas manter o flex-between já resolve. Opcional: colocar algo na direita. */}
          <div className="w-24"></div> 
        </div>''',
'''          {/* Espaçador invisível para centralizar o preço se quisermos, mas manter o flex-between já resolve. Opcional: colocar algo na direita. */}
            <div className="w-24"></div> 
          </div>
        </div>'''
)

# Participantes
content = content.replace(
'''            <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-5 rounded-md shrink-0">
              <div className="text-base text-gray-400 mb-4 font-bold">PARTICIPANTES</div>''',
'''            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md shrink-0 overflow-hidden flex flex-col">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center">
                PARTICIPANTES
              </div>
              <div className="p-5 pt-4">'''
).replace(
'''                  </>
                )}
              </div>
            </div>''',
'''                  </>
                )}
              </div>
              </div>
            </div>'''
)


# Notícias / Eventos
content = content.replace(
'''              <div className="col-span-8 bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex flex-col min-h-0">
                <div className="text-base text-gray-400 mb-3 font-bold shrink-0">
                   📄 NOTÍCIAS AO VIVO
                </div>''',
'''              <div className="col-span-8 bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col min-h-0 overflow-hidden">
                <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center shrink-0">
                   📄 NOTÍCIAS AO VIVO
                </div>
                <div className="p-4 pt-0 overflow-y-auto flex-1 flex flex-col">'''
).replace(
'''                  </table>
                </div>
              </div>''',
'''                  </table>
                </div>
              </div>''' # actually this doesn't need to close differently, wait, I wrapped it in <div class="p-4..."> so I need an extra closing div.
)
# Ah wait, I replaced `<div className="overflow-y-auto flex-1">` in my head.
# Let's fix Eventos precisely using regex.
content = re.sub(
    r'<div className="col-span-8 bg-\[\#1c1c1c\] border border-\[\#2a2a2a\] p-4 rounded-md flex flex-col min-h-0">\s*<div className="text-base text-gray-400 mb-3 font-bold shrink-0">\s*📄 NOTÍCIAS AO VIVO\s*</div>\s*<div className="overflow-y-auto flex-1">',
    '''<div className="col-span-8 bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col min-h-0 overflow-hidden">
                <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center shrink-0">
                   📄 NOTÍCIAS AO VIVO
                </div>
                <div className="p-4 pt-0 overflow-y-auto flex-1 flex flex-col">
                  <div className="overflow-y-auto flex-1 mt-3">''',
    content
)
# And the closing tag for Eventos
content = content.replace(
'''                      )}
                    </tbody>
                  </table>
                </div>
              </div>''',
'''                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>'''
)


# Preço/Níveis
content = content.replace(
'''              <div className="col-span-4 bg-[#1c1c1c] border border-[#2a2a2a] p-4 rounded-md flex flex-col justify-center">
                <div className="text-base text-gray-400 mb-6 font-bold flex items-center gap-2">💰 PREÇO / NÍVEIS</div>''',
'''              <div className="col-span-4 bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex flex-col justify-center overflow-hidden">
                <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                  💰 PREÇO / NÍVEIS
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center">'''
).replace(
'''                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 tracking-widest">MÍNIMA</span>
                    <span className="text-[#22c55e] font-bold text-2xl">{fairValue?.minima ? formatPts(fairValue.minima) : '---'}</span>
                  </div>
                </div>
              </div>''',
'''                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 tracking-widest">MÍNIMA</span>
                    <span className="text-[#22c55e] font-bold text-2xl">{fairValue?.minima ? formatPts(fairValue.minima) : '---'}</span>
                  </div>
                </div>
                </div>
              </div>'''
)

# Indicadores Macro
content = content.replace(
'''            <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-5 rounded-md flex-1 overflow-y-auto">
              <div className="text-base text-gray-400 mb-4 font-bold flex items-center gap-2">
                📊 INDICADORES MACRO
              </div>''',
'''            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                📊 INDICADORES MACRO
              </div>
              <div className="p-5 pt-3 overflow-y-auto flex-1">'''
).replace(
'''                  </div>
                ))}
              </div>
            </div>''',
'''                  </div>
                ))}
              </div>
              </div>
            </div>'''
)

# Juros / Commodities
content = content.replace(
'''            <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-5 rounded-md shrink-0">
              <div className="text-base text-gray-400 mb-4 font-bold flex items-center gap-2">
                📈 JUROS / COMMODITIES
              </div>''',
'''            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-md shrink-0 overflow-hidden flex flex-col">
              <div className="bg-[#2a2a2a] text-sm text-gray-300 px-4 py-1.5 font-bold flex items-center gap-2 shrink-0">
                📈 JUROS / COMMODITIES
              </div>
              <div className="p-5 pt-3">'''
).replace(
'''                  </div>
                ))}
              </div>
            </div>
            
          </div>''',
'''                  </div>
                ))}
              </div>
              </div>
            </div>
            
          </div>'''
)

with open('src/app/dashboard/demo/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
