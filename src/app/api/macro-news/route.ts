import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import fs from 'fs'
import path from 'path'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

export const revalidate = 180 // Cache for 3 minutos

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail']
    ]
  }
})

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


function analyzeWDOPressure(title: string, summary: string): 'ALTA' | 'BAIXA' | 'NEUTRO' {
  const text = (title + ' ' + summary).toLowerCase()
  let scoreAlta = 0
  let scoreBaixa = 0

  // Fatores que fazem o dólar SUBIR (aversão a risco, piora fiscal, juros altos EUA, queda na bolsa)
  const keywordsAlta = [
    'tensão', 'guerra', 'piora', 'risco', 'rombo', 'déficit', 'inflação alta', 
    'juros altos', 'conflito', 'preocupação', 'incerteza', 'escalada', 'ataque', 
    'fuga de capital', 'decepção', 'temor', 'pressão', 'crise', 'estresse'
  ]
  
  // Fatores que fazem o dólar CAIR (apetite a risco, melhora fiscal, corte de juros EUA, alta na bolsa)
  const keywordsBaixa = [
    'alívio', 'corte de juros', 'melhora', 'superávit', 'otimismo', 'arrefecimento', 
    'paz', 'acordo', 'entrada de capital', 'confiança', 'surpresa positiva', 'estímulo'
  ]

  // Ação direta no preço (se falar dólar sobe, é alta)
  if (text.includes('dólar sobe') || text.includes('dólar avança') || text.includes('dólar dispara') || text.includes('dólar opera em alta')) scoreAlta += 5
  if (text.includes('dólar cai') || text.includes('dólar recua') || text.includes('dólar cede') || text.includes('dólar opera em queda')) scoreBaixa += 5

  // Ação no ibovespa (relação inversa)
  if (text.includes('ibovespa cai') || text.includes('ibovespa recua')) scoreAlta += 2
  if (text.includes('ibovespa sobe') || text.includes('ibovespa avança')) scoreBaixa += 2

  keywordsAlta.forEach(k => { if (text.includes(k)) scoreAlta += 1 })
  keywordsBaixa.forEach(k => { if (text.includes(k)) scoreBaixa += 1 })

  if (scoreAlta > scoreBaixa) return 'ALTA'
  if (scoreBaixa > scoreAlta) return 'BAIXA'
  return 'NEUTRO'
}

function calculateImpactScore(title: string, summary: string): number {
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

export async function GET(request: Request) {
  try {
    let allArticles: any[] = []

    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl)
        feed.items.forEach(item => {
          const title = item.title || ''
          const summary = item.contentSnippet || item.content || ''
          const score = calculateImpactScore(title, summary)
          
          if (score > 0) {
            let imageUrl = null
            if (item.enclosure && item.enclosure.url) imageUrl = item.enclosure.url
            else if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) imageUrl = item.mediaContent.$.url
            else if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) imageUrl = item.mediaThumbnail.$.url
            else {
              const match = (item.content || '').match(/<img[^>]+src="([^">]+)"/)
              if (match) imageUrl = match[1]
            }
            if (imageUrl) imageUrl = imageUrl.replace(/&amp;/g, '&')

            allArticles.push({
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
            })
          }
        })
      } catch (e) {
        console.error('Erro ao buscar feed ' + feedUrl, e)
      }
    }

    allArticles.sort((a, b) => {
      // Ordenar da mais recente para a mais antiga, independentemente do score
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

    const geminiKey = request.headers.get('x-gemini-key')
    const CACHE_FILE = path.join(process.cwd(), 'ai-cache.json')
    
    // 1. Carrega o cache existente
    let aiCache: Record<string, any> = {}
    try {
      if (fs.existsSync(CACHE_FILE)) {
        aiCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
      }
    } catch (e) {}

    // 2. Aplica o cache nas notícias que já foram analisadas
    const articlesToAnalyze = []
    for (const art of topArticles) {
      if (aiCache[art.id]) {
        art.wdoPressure = aiCache[art.id].wdoPressure
        art.score = aiCache[art.id].score
        art.analysisType = 'AI'
      } else {
        articlesToAnalyze.push(art)
      }
    }

        // 3. Se houver notícias novas e a chave do Gemini, e o usuário CLICOU para forçar
    const forceAI = request.headers.get('x-force-ai') === 'true'
    
    if (articlesToAnalyze.length > 0 && geminiKey && geminiKey.trim() !== '' && forceAI) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({
          model: "gemini-flash-latest",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  wdoPressure: { type: SchemaType.STRING, description: "ALTA, BAIXA ou NEUTRO" },
                  score: { type: SchemaType.NUMBER }
                }
              }
            }
          }
        })
        const prompt = `Analise as seguintes manchetes financeiras e classifique o impacto direcional no Dólar Futuro Brasileiro (WDO).
Se a notícia impulsionar o dólar para cima (piora fiscal, tensões globais, guerras, juros altos nos EUA, risco), classifique como ALTA.
Se a notícia puxar o dólar para baixo (corte de juros nos EUA, superávit fiscal, paz, otimismo), classifique como BAIXA.
Se for irrelevante ou mista, NEUTRO.
O score deve ser de 0 a 5 indicando a intensidade do impacto.
Notícias:
${articlesToAnalyze.map(a => `ID: ${a.id}\nManchete: ${a.title}\nResumo: ${a.summary}`).join('\n\n')}`
        
        const result = await model.generateContent(prompt)
        const aiAnalysis = JSON.parse(result.response.text())
        
        for (const art of articlesToAnalyze) {
          const ai = aiAnalysis.find((x: any) => x.id === art.id)
          if (ai) {
            art.wdoPressure = ai.wdoPressure
            art.score = ai.score
            art.analysisType = 'AI'
            
            // Salva no objeto de cache
            aiCache[art.id] = {
              wdoPressure: ai.wdoPressure,
              score: ai.score
            }
          }
        }

        // Persiste o cache no disco para as próximas requisições
        try {
          const keys = Object.keys(aiCache)
          if (keys.length > 100) {
             const keysToRemove = keys.slice(0, keys.length - 100)
             keysToRemove.forEach(k => delete aiCache[k])
          }
          fs.writeFileSync(CACHE_FILE, JSON.stringify(aiCache), 'utf8')
        } catch (e) {}

      } catch (e: any) {
        console.error('Gemini AI Error:', e)
        return NextResponse.json({
          timestamp: Date.now(),
          articles: topArticles,
          aiError: e.message || 'Erro desconhecido na API do Gemini'
        })
      }
    }

    return NextResponse.json({
      timestamp: Date.now(),
      articles: topArticles
    })
  } catch (error) {
    console.error('Macro News API Error:', error)
    return NextResponse.json({ articles: [] })
  }
}
