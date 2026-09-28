const fs = require('fs');
const pathStr = 'src/app/api/macro-news/route.ts';
let content = fs.readFileSync(pathStr, 'utf8');

// I need to add fs and path imports at the top
if (!content.includes("import fs from 'fs'")) {
  content = content.replace("import Parser from 'rss-parser'", "import Parser from 'rss-parser'\nimport fs from 'fs'\nimport path from 'path'");
}

const aiBlockOld = `    const geminiKey = request.headers.get('x-gemini-key')
    if (geminiKey && geminiKey.trim() !== '') {
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
                  wdoPressure: { type: SchemaType.STRING, enum: ["ALTA", "BAIXA", "NEUTRO"] },
                  score: { type: SchemaType.NUMBER }
                }
              }
            }
          }
        })
        const prompt = \`Analise as seguintes manchetes financeiras e classifique o impacto direcional no Dólar Futuro Brasileiro (WDO).
Se a notícia impulsionar o dólar para cima (piora fiscal, tensões globais, guerras, juros altos nos EUA, risco), classifique como ALTA.
Se a notícia puxar o dólar para baixo (corte de juros nos EUA, superávit fiscal, paz, otimismo), classifique como BAIXA.
Se for irrelevante ou mista, NEUTRO.
O score deve ser de 0 a 5 indicando a intensidade do impacto.
Notícias:
\${topArticles.map(a => \`ID: \${a.id}\\nManchete: \${a.title}\\nResumo: \${a.summary}\`).join('\\n\\n')}\`
        
        const result = await model.generateContent(prompt)
        const aiAnalysis = JSON.parse(result.response.text())
        
        for (const art of topArticles) {
          const ai = aiAnalysis.find(x => x.id === art.id)
          if (ai) {
            art.wdoPressure = ai.wdoPressure
            art.score = ai.score
            art.analysisType = 'AI'
          }
        }
      } catch (e) {
        console.error('Gemini AI Error:', e)
      }
    }`;

const aiBlockNew = `    const geminiKey = request.headers.get('x-gemini-key')
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

    // 3. Se houver notícias novas e a chave do Gemini, analisa APENAS as novas
    if (articlesToAnalyze.length > 0 && geminiKey && geminiKey.trim() !== '') {
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
                  wdoPressure: { type: SchemaType.STRING, enum: ["ALTA", "BAIXA", "NEUTRO"] },
                  score: { type: SchemaType.NUMBER }
                }
              }
            }
          }
        })
        const prompt = \`Analise as seguintes manchetes financeiras e classifique o impacto direcional no Dólar Futuro Brasileiro (WDO).
Se a notícia impulsionar o dólar para cima (piora fiscal, tensões globais, guerras, juros altos nos EUA, risco), classifique como ALTA.
Se a notícia puxar o dólar para baixo (corte de juros nos EUA, superávit fiscal, paz, otimismo), classifique como BAIXA.
Se for irrelevante ou mista, NEUTRO.
O score deve ser de 0 a 5 indicando a intensidade do impacto.
Notícias:
\${articlesToAnalyze.map(a => \`ID: \${a.id}\\nManchete: \${a.title}\\nResumo: \${a.summary}\`).join('\\n\\n')}\`
        
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

      } catch (e) {
        console.error('Gemini AI Error:', e)
      }
    }`;

// use indexOf and substring to avoid weird regex issues
const startIndex = content.indexOf(`    const geminiKey = request.headers.get('x-gemini-key')`);
const endIndex = content.indexOf(`    return NextResponse.json({`);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + aiBlockNew + '\n\n' + content.substring(endIndex);
  fs.writeFileSync(pathStr, content, 'utf8');
} else {
  console.log("Could not find blocks to replace.");
}
