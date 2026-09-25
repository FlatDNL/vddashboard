const fs = require('fs');

let content = fs.readFileSync('src/components/FairValueWidget.tsx', 'utf-8');
content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/components/FairValueWidget.tsx', content);
console.log('Fixed FairValueWidget');
