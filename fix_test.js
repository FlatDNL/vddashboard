const fs = require('fs');
const path = 'src/app/api/test-gemini/route.ts';
let content = fs.readFileSync(path, 'utf8');

// The file has literal backslashes before backticks and dollars.
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(path, content, 'utf8');
