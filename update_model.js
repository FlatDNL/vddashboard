const fs = require('fs');

function updateFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/model: "gemini-1\.5-flash(-latest)?"/g, 'model: "gemini-1.5-flash"'); 
  // Let's use gemini-1.5-flash-latest to be safe
  content = content.replace(/model: "gemini-1\.5-flash"/g, 'model: "gemini-1.5-flash-latest"');
  fs.writeFileSync(path, content, 'utf8');
}

updateFile('src/app/api/macro-news/route.ts');
updateFile('src/app/api/test-gemini/route.ts');
