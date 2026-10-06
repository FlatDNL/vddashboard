import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove state `debugOffset`
content = content.replace("  const [debugOffset, setDebugOffset] = useState(0)\n", "")

# 2. Revert interval logic: remove `+ debugOffset`
old_interval = '''  useEffect(() => {
    const currentMs = nowTimer.getTime() + debugOffset
    news.forEach(item => {
      if (!item.dateIso) return
      const eventMs = new Date(item.dateIso).getTime()
      const diffSeconds = Math.floor((eventMs - currentMs) / 1000)
      
      // Faltando 5 segundos para a noticia
      if (diffSeconds <= 5 && diffSeconds > -300 && !triggeredModals.current.has(item.dateIso)) {
        triggeredModals.current.add(item.dateIso)
        setActiveModalTime(item.dateIso)
      }
    })
  }, [nowTimer, debugOffset, news])'''

new_interval = '''  useEffect(() => {
    const currentMs = nowTimer.getTime()
    news.forEach(item => {
      if (!item.dateIso) return
      const eventMs = new Date(item.dateIso).getTime()
      const diffSeconds = Math.floor((eventMs - currentMs) / 1000)
      
      // Faltando 5 segundos para a noticia
      if (diffSeconds <= 5 && diffSeconds > -300 && !triggeredModals.current.has(item.dateIso)) {
        triggeredModals.current.add(item.dateIso)
        setActiveModalTime(item.dateIso)
      }
    })
  }, [nowTimer, news])'''

content = content.replace(old_interval, new_interval)

# 3. Remove Debug functions
debug_funcs_pattern = r'  // Funções de Debug\s*const testYellow = \(\) => \{.*?setActiveModalTime\(null\)\s*\}'
content = re.sub(debug_funcs_pattern, '', content, flags=re.DOTALL)

# 4. Revert render logic: remove `+ debugOffset`
old_render = '''                          if (item.dateIso) {
                            const diffSeconds = Math.floor((new Date(item.dateIso).getTime() - (nowTimer.getTime() + debugOffset)) / 1000)'''
                            
new_render = '''                          if (item.dateIso) {
                            const diffSeconds = Math.floor((new Date(item.dateIso).getTime() - nowTimer.getTime()) / 1000)'''

content = content.replace(old_render, new_render)

# 5. Remove Debug buttons JSX
buttons_pattern = r'\s*\{/\* Botões de Debug \*/\}\s*<div className="flex justify-center gap-2 p-2 bg-\[#1c1c1c\] border-t border-\[#333\] shrink-0">.*?</div>'
content = re.sub(buttons_pattern, '', content, flags=re.DOTALL)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
