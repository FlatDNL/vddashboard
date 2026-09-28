const fs = require('fs');

const path = 'src/app/api/macro-news/route.ts';
let content = fs.readFileSync(path, 'utf8');

const targetFunction = `function calculateImpactScore(title: string, summary: string): number {`;

const pressureAnalysisFunction = `
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

function calculateImpactScore(title: string, summary: string): number {`;

content = content.replace(targetFunction, pressureAnalysisFunction);

const parsingOld = `summary: summary.slice(0, 150) + '...',
              imageUrl: imageUrl
            })`;

const parsingNew = `summary: summary.slice(0, 150) + '...',
              imageUrl: imageUrl,
              wdoPressure: analyzeWDOPressure(title, summary)
            })`;

content = content.replace(parsingOld, parsingNew);

fs.writeFileSync(path, content, 'utf8');
