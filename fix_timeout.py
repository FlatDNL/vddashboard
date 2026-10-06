import re

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the side-effect timeout inside render. We need to move it up.
# First, remove the bad timeout from the render logic:
bad_timeout_code = """        // Setup timeout para fechar 10s após resultado
        if (activeModalEvent?.pressure?.direction && activeModalEvent.pressure.direction !== 'AGUARDANDO') {
           setTimeout(() => {
             setActiveModalEventId(null)
           }, 10000)
        }"""
content = content.replace(bad_timeout_code, "")

# Now add the proper useEffect for the modal timeout near the other hooks.
# Let's find: `const [loading, setLoading] = useState(true)`
# and put it below that.
good_timeout_hook = """
  useEffect(() => {
    if (!activeModalEventId) return;
    const activeModalEvent = news.find(n => n.id === activeModalEventId);
    if (activeModalEvent?.pressure?.direction && activeModalEvent.pressure.direction !== 'AGUARDANDO') {
      const t = setTimeout(() => {
        setActiveModalEventId(null);
      }, 10000);
      return () => clearTimeout(t);
    }
  }, [activeModalEventId, news]);
"""

content = content.replace("const [loading, setLoading] = useState(true)", "const [loading, setLoading] = useState(true)" + good_timeout_hook)

with open('src/app/dashboard/dashbloom/BloombergTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
