const fs = require('fs');
const content = `import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

export const revalidate = 180 // Cache for 3 minutos

const parser = new Parser()

const RSS_FEEDS = [
  'https://www.infomoney.com.br/feed/',
  'https://g1.globo.com/rss/g1/economia/',
  'https://valor.globo.com/rss/valor'
]

// Palavras-chave que indicam impacto macroeconomico e no Dolar (WDO)
const IMPACT_KEYWORDS = [
  'dólar', 'dolar', 'câmbio', 'ptax', 'wdo', 'bovespa', 'ibovespa',
  'guerra', 'conflito', 'tensão', 'geopolítica', 'oriente médio', 'israel', 'rússia', 'ucrânia', 'putin', 'zelensky',
  'petróleo', 'brent', 'combustível', 'gasolina', 'petrobras',
  'fed', 'federal reserve', 'powell', 'juros eua', 'payroll', 'treasuries',
  'copom', 'banco central', 'campos neto', 'selic', 'galípolo',
  'lula', 'haddad', 'fiscal', 'arcabouço', 'meta fiscal', 'imposto', 'governo'
]

function calculateImpactScore(title, summary) {
  const text = (title + ' ' + summary).toLowerCase()
  let score = 0
  
  IMPACT_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      score += 1
      if (['dólar', 'dolar', 'fed', 'copom', 'guerra', 'petróleo', 'oriente médio', 'israel', 'rússia'].includes(keyword.toLowerCase())) {
        score += 2
      }
    }
  })
  return score
}

export async function GET() {
  try {
    let allArticles = []

    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl)
        feed.items.forEach(item => {
          const title = item.title || ''
          const summary = item.contentSnippet || item.content || ''
          const score = calculateImpactScore(title, summary)
          
          if (score > 0) {
            allArticles.push({
              id: item.guid || item.link,
              title: title,
              publisher: feed.title || 'Notícias',
              link: item.link,
              providerPublishTime: item.isoDate || item.pubDate || new Date().toISOString(),
              score: score,
              summary: summary.slice(0, 150) + '...'
            })
          }
        })
      } catch (e) {
        console.error('Erro ao buscar feed ' + feedUrl, e)
      }
    }

    allArticles.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return new Date(b.providerPublishTime).getTime() - new Date(a.providerPublishTime).getTime()
    })

    const uniqueArticles = []
    const titles = new Set()
    for (const art of allArticles) {
      if (!titles.has(art.title)) {
        titles.add(art.title)
        uniqueArticles.push(art)
      }
    }

    const topArticles = uniqueArticles.slice(0, 15)

    return NextResponse.json({
      timestamp: Date.now(),
      articles: topArticles
    })
  } catch (error) {
    console.error('Macro News API Error:', error)
    return NextResponse.json({ articles: [] })
  }
}
`;
fs.writeFileSync('src/app/api/macro-news/route.ts', content, 'utf8');
