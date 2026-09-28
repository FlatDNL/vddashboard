const fs = require('fs');

const pathStr = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

content = content + '\n// trigger rebuild\n';
fs.writeFileSync(pathStr, content, 'utf8');
