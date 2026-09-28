const fs = require('fs');

const path = 'src/components/NotificationBell.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file likely has literally \` and \$ inserted by the tool.
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(path, content, 'utf8');
