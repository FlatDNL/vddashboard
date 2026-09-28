const fs = require('fs');

const path = 'src/app/api/macro-news/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Find the AI error catch block
const targetError = `} catch (e) {
        console.error('Gemini AI Error:', e)
      }
    }

    return NextResponse.json({
      timestamp: Date.now(),
      articles: topArticles
    })`;

const newError = `} catch (e: any) {
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
    })`;

content = content.replace(targetError, newError);
fs.writeFileSync(path, content, 'utf8');
