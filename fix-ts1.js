const fs = require('fs');

let content = fs.readFileSync('src/lib/risk-engine.ts', 'utf-8');
content = content.replace(
  "const result = await yahooFinance.historical(symbol, { period1: start, period2: end })",
  "const result = await yahooFinance.historical(symbol, { period1: start, period2: end }) as any[]"
);

fs.writeFileSync('src/lib/risk-engine.ts', content);
console.log('Fixed risk-engine type');
