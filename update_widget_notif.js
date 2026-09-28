const fs = require('fs');

const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('useNotificationStore')) {
  content = content.replace(
    "import { ExternalLink, Clock, Newspaper, TrendingUp, TrendingDown, Hash, Sparkles } from 'lucide-react'",
    "import { ExternalLink, Clock, Newspaper, TrendingUp, TrendingDown, Hash, Sparkles } from 'lucide-react'\nimport { useNotificationStore } from '@/store/notifications'"
  );

  const targetFetch = `const newsRes = await fetch('/api/macro-news', {
          headers: {
            'x-gemini-key': apiKey || ''
          }
        })
        const newsData = await newsRes.json()
        setArticles(newsData.articles || [])`;

  const newFetch = `const newsRes = await fetch('/api/macro-news', {
          headers: {
            'x-gemini-key': apiKey || ''
          }
        })
        const newsData = await newsRes.json()
        setArticles(newsData.articles || [])
        
        if (newsData.aiError) {
          useNotificationStore.getState().addNotification({
            title: 'Falha na IA',
            message: 'A comunicação com o Google Gemini falhou: ' + newsData.aiError + '. O sistema voltou a usar o algoritmo padrão temporariamente.',
            type: 'error'
          })
        }`;

  content = content.replace(targetFetch, newFetch);
  fs.writeFileSync(path, content, 'utf8');
}
