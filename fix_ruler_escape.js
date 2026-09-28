const fs = require('fs');

const pathStr = 'src/components/OperationalRulerWidget.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(pathStr, content, 'utf8');
