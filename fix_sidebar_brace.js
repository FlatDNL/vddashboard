const fs = require('fs');

const pathStr = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

if (content.trim().endsWith(')')) {
  content = content.trim() + '\n}\n';
  fs.writeFileSync(pathStr, content, 'utf8');
}
