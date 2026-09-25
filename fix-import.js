const fs = require('fs');

let content = fs.readFileSync('src/lib/risk-engine.ts', 'utf-8');

content = content.replace(
  "import yahooFinance from 'yahoo-finance2'",
  "import YahooFinance from 'yahoo-finance2'\n\nconst yahooFinance = new YahooFinance()"
);

fs.writeFileSync('src/lib/risk-engine.ts', content);
console.log('Fixed yahooFinance import in risk-engine');
