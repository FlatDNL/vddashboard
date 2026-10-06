import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_render = '''                          if (item.dateIso) {
                            const diffSeconds = Math.floor((new Date(item.dateIso).getTime() - (nowTimer.getTime() + debugOffset)) / 1000)
                            if (diffSeconds > 0 && diffSeconds <= 300) {
                              const m = Math.floor(diffSeconds / 60).toString().padStart(2, '0')
                              const s = (diffSeconds % 60).toString().padStart(2, '0')
                              displayTime = `${m}:${s}`
                              textTimeClass = "text-white font-bold"
                              if (diffSeconds <= 60) {
                                rowClass = "border-b border-red-500 bg-[#451a1a] transition-colors leading-tight"
                              } else {
                                rowClass = "border-b border-yellow-500 bg-[#423812] transition-colors leading-tight"
                              }
                            }
                          }'''

new_render = '''                          if (item.dateIso) {
                            const diffSeconds = Math.floor((new Date(item.dateIso).getTime() - (nowTimer.getTime() + debugOffset)) / 1000)
                            if (diffSeconds > 0 && diffSeconds <= 300) {
                              const m = Math.floor(diffSeconds / 60).toString().padStart(2, '0')
                              const s = (diffSeconds % 60).toString().padStart(2, '0')
                              displayTime = `${m}:${s}`
                              if (diffSeconds <= 60) {
                                textTimeClass = "text-red-400 font-black animate-pulse"
                                rowClass = "border-b border-red-500 bg-[#451a1a] transition-colors leading-tight animate-pulse"
                              } else {
                                textTimeClass = "text-yellow-400 font-black"
                                rowClass = "border-b border-yellow-500 bg-[#423812] transition-colors leading-tight"
                              }
                            }
                          }'''

content = content.replace(old_render, new_render)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
