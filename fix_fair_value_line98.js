const fs = require('fs');

const pathStr = 'src/app/api/fair-value/route.ts';
let content = fs.readFileSync(pathStr, 'utf8');

content = content.replace(
  "const atual = brl.price * 1000",
  "const atual = (brl?.price || 5.400) * 1000"
);

fs.writeFileSync(pathStr, content, 'utf8');
