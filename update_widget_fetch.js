const fs = require('fs');

const path = 'src/components/MacroOverviewWidget.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetFetch = `const newsRes = await fetch('/api/macro-news')`;
const replacementFetch = `const apiKey = localStorage.getItem('gemini_api_key')
        const newsRes = await fetch('/api/macro-news', {
          headers: {
            'x-gemini-key': apiKey || ''
          }
        })`;

content = content.replace(targetFetch, replacementFetch);
fs.writeFileSync(path, content, 'utf8');
