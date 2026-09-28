const fs = require('fs');
const path = 'src/app/api/macro-news/route.ts';
let content = fs.readFileSync(path, 'utf8');

const targetPushOld = `allArticles.push({
              id: item.guid || item.link,
              title: title,
              publisher: feed.title || 'Notícias',
              link: item.link,
              providerPublishTime: item.isoDate || item.pubDate || new Date().toISOString(),
              score: score,
              summary: summary.slice(0, 150) + '...',
              imageUrl: imageUrl,
              wdoPressure: analyzeWDOPressure(title, summary)
            })`;

const targetPushNew = `allArticles.push({
              id: item.guid || item.link,
              title: title,
              publisher: feed.title || 'Notícias',
              link: item.link,
              providerPublishTime: item.isoDate || item.pubDate || new Date().toISOString(),
              score: score,
              summary: summary.slice(0, 150) + '...',
              imageUrl: imageUrl,
              wdoPressure: analyzeWDOPressure(title, summary),
              analysisType: 'ALGORITHM'
            })`;

content = content.replace(targetPushOld, targetPushNew);

const aiLoopOld = `for (const art of topArticles) {
          const ai = aiAnalysis.find(x => x.id === art.id)
          if (ai) {
            art.wdoPressure = ai.wdoPressure
            art.score = ai.score
          }
        }`;

const aiLoopNew = `for (const art of topArticles) {
          const ai = aiAnalysis.find(x => x.id === art.id)
          if (ai) {
            art.wdoPressure = ai.wdoPressure
            art.score = ai.score
            art.analysisType = 'AI'
          }
        }`;

content = content.replace(aiLoopOld, aiLoopNew);

fs.writeFileSync(path, content, 'utf8');
