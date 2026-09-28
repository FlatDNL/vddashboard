const fs = require('fs');
const path = 'src/app/api/macro-news/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Add imports
content = content.replace("import Parser from 'rss-parser'", "import Parser from 'rss-parser'\nimport { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'");

// Replace GET signature
content = content.replace("export async function GET() {", "export async function GET(request: Request) {");

const beforeReturn = `    const topArticles = uniqueArticles.slice(0, 15)

    return NextResponse.json({`;

const afterReturn = `    const topArticles = uniqueArticles.slice(0, 15)

    const geminiKey = request.headers.get('x-gemini-key')
    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
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
          }
        }
      } catch (e) {
        console.error('Gemini AI Error:', e)
      }
    }

    return NextResponse.json({`;

content = content.replace(beforeReturn, afterReturn);

// Also we should set cache control correctly if we use headers. 
// Using headers makes the route dynamic in Next.js automatically, which is fine since we do 3 min polling client-side.
// We can remove `export const revalidate = 180` because dynamic functions can't use static revalidate in the same way, or it skips cache anyway. Let's just leave it, it might still cache per key.

fs.writeFileSync(path, content, 'utf8');
