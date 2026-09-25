const fs = require('fs');

let content = fs.readFileSync('src/components/RiskChartWidget.tsx', 'utf-8');

content = content.replace(
  "const interval = setInterval(tickEngineAndLoad, 60000)",
  "const interval = setInterval(tickEngineAndLoad, 30000)"
);

fs.writeFileSync('src/components/RiskChartWidget.tsx', content);
console.log('Updated RiskChartWidget polling to 30s');
