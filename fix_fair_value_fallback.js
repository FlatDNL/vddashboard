const fs = require('fs');

const pathStr = 'src/app/api/fair-value/route.ts';
let content = fs.readFileSync(pathStr, 'utf8');

content = content.replace(
  "const justo = brl.prev * 1000",
  "const justo = (brl?.prev || brl?.price || 5.400) * 1000"
);

fs.writeFileSync(pathStr, content, 'utf8');
