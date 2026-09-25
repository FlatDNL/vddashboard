const fs = require('fs');
let content = fs.readFileSync('src/components/RiskChartWidget.tsx', 'utf-8');
content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/components/RiskChartWidget.tsx', content);
console.log('Fixed syntax in chart');
