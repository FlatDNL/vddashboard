const fs = require('fs');
const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('analyzingAI')) {
  // Add state
  content = content.replace("const [loading, setLoading] = useState(true)", "const [loading, setLoading] = useState(true)\n  const [analyzingAI, setAnalyzingAI] = useState(false)");
  
  // Add function
  const functionCode = `  const forceAIAnalysis = async () => {
    setAnalyzingAI(true)
    try {
      const apiKey = localStorage.getItem('gemini_api_key')
      if (!apiKey) {
        useNotificationStore.getState().addNotification({
          title: 'IA não configurada',
          message: 'Vá nas configurações e insira a chave do Gemini.',
          type: 'warning'
        })
        setAnalyzingAI(false)
        return
      }
      const newsRes = await fetch('/api/macro-news', {
        headers: {
          'x-gemini-key': apiKey,
          'x-force-ai': 'true'
        }
      })
      const newsData = await newsRes.json()
      setArticles(newsData.articles || [])
      
      if (newsData.aiError) {
        useNotificationStore.getState().addNotification({
          title: 'Falha na IA',
          message: 'Erro: ' + newsData.aiError,
          type: 'error'
        })
      }
    } catch (e) {
    } finally {
      setAnalyzingAI(false)
    }
  }`;

  content = content.replace("useEffect(() => {", functionCode + "\n\n  useEffect(() => {");
  
  // Add button to render
  const targetRender = `return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">`;
  
  const fallbackRegex = /return\s*\(\s*<div className="flex flex-col gap-4">\s*<div className="flex flex-col gap-3">/;

  const newRender = `  const hasUnanalyzed = articles.some(a => a.analysisType !== 'AI');
  
  return (
    <div className="flex flex-col gap-4">
      {hasUnanalyzed && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-400" size={20} />
            <div>
              <h3 className="text-sm font-bold text-slate-200">Existem notícias não analisadas pela IA</h3>
              <p className="text-xs text-slate-400">Atualmente o sistema está usando o algoritmo de palavras-chave para economizar tokens.</p>
            </div>
          </div>
          <button 
            onClick={forceAIAnalysis}
            disabled={analyzingAI}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {analyzingAI ? 'Analisando...' : 'Analisar com IA'}
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3">`;

  content = content.replace(fallbackRegex, newRender);

  fs.writeFileSync(path, content, 'utf8');
}
