import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace state and the old useEffect
pattern = r'const \[nowTimer, setNowTimer\] = useState\(new Date\(\)\)\s*const \[activeModalEventId, setActiveModalEventId\] = useState<string \| null>\(null\)\s*const triggeredModals = useRef<Set<string>>\(new Set\(\)\)\s*const \[loading, setLoading\] = useState\(true\)\s*useEffect\(\(\) => \{\s*if \(\!activeModalEventId\) return;\s*const activeModalEvent = news\.find\(n => n\.id === activeModalEventId\);\s*if \(activeModalEvent\?\.pressure\?\.direction && activeModalEvent\.pressure\.direction \!\=\= \'AGUARDANDO\'\) \{\s*const t = setTimeout\(\(\) => \{\s*setActiveModalEventId\(null\);\s*\}, 10000\);\s*return \(\) => clearTimeout\(t\);\s*\}\s*\}, \[activeModalEventId, news\]\);'

new_state = '''const [nowTimer, setNowTimer] = useState(new Date())
  const [debugOffset, setDebugOffset] = useState(0)
  const [activeModalTime, setActiveModalTime] = useState<string | null>(null)
  const triggeredModals = useRef<Set<string>>(new Set())
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeModalTime) return;
    const modalEvents = news.filter(n => n.dateIso === activeModalTime);
    if (modalEvents.length > 0) {
      // Checa se TODOS os eventos deste horário já tiveram a pressão calculada
      const allCalculated = modalEvents.every(e => e.pressure?.direction && e.pressure.direction !== 'AGUARDANDO');
      if (allCalculated) {
        const t = setTimeout(() => {
          setActiveModalTime(null);
        }, 10000);
        return () => clearTimeout(t);
      }
    }
  }, [activeModalTime, news]);'''

content = re.sub(pattern, new_state, content, flags=re.DOTALL)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
