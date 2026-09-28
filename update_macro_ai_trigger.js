const fs = require('fs');

const pathStr = 'src/app/api/macro-news/route.ts';
let content = fs.readFileSync(pathStr, 'utf8');

const targetIf = `    // 3. Se houver notcias novas e a chave do Gemini, analisa APENAS as novas
    if (articlesToAnalyze.length > 0 && geminiKey && geminiKey.trim() !== '') {`;
// Fallback for weird encoding chars
const fallbackRegex = /\/\/\ 3\.\ Se houver not[^]*?if\s*\(articlesToAnalyze\.length > 0 && geminiKey && geminiKey\.trim\(\) !== ''\)\s*\{/;

const newIf = `    // 3. Se houver notícias novas e a chave do Gemini, e o usuário CLICOU para forçar
    const forceAI = request.headers.get('x-force-ai') === 'true'
    
    if (articlesToAnalyze.length > 0 && geminiKey && geminiKey.trim() !== '' && forceAI) {`;

content = content.replace(fallbackRegex, newIf);
fs.writeFileSync(pathStr, content, 'utf8');
