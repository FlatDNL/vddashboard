const fs = require('fs');

function updateModel(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/gemini-1\.5-flash-latest/g, 'gemini-flash-latest');
  fs.writeFileSync(path, content, 'utf8');
}

updateModel('src/app/api/test-gemini/route.ts');
updateModel('src/app/api/macro-news/route.ts');
