const fs = require('fs');
let c = fs.readFileSync('src/app/api/macro-news/route.ts', 'utf8');
c = c.replace(/model: "gemini-1\.5-flash"/g, 'model: "gemini-1.5-flash-latest"');
fs.writeFileSync('src/app/api/macro-news/route.ts', c, 'utf8');
