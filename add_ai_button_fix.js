const fs = require('fs');
const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetReturn = `  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">`;

const newReturn = `  const hasUnanalyzed = articles.some(a => a.analysisType !== 'AI');

  return (
    <div className="flex flex-col gap-6">
      
      {hasUnanalyzed && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-400" size={20} />
            <div>
              <h3 className="text-sm font-bold text-slate-200">Existem notícias não analisadas pela IA</h3>
              <p className="text-xs text-slate-400">Clique para rodar uma análise profunda com o Gemini.</p>
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

      <div className="flex items-center gap-3">`;

content = content.replace(targetReturn, newReturn);
fs.writeFileSync(path, content, 'utf8');
