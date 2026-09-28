const fs = require('fs');

const pathStr = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

content = content.replace(
  "  Activity,",
  "  Activity,\n  Play,\n  RefreshCw,"
);

fs.writeFileSync(pathStr, content, 'utf8');
