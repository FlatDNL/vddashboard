const fs = require('fs');

let content = fs.readFileSync('src/components/RiskChartWidget.tsx', 'utf-8');

// Remove 1m from TIMEFRAMES
content = content.replace(
  "{ id: '1m', label: '1m' },\n  ",
  ""
);

// Modify the initial timeframe state from '1m' to '30m'
content = content.replace(
  "const [timeframe, setTimeframe] = useState('1m')",
  "const [timeframe, setTimeframe] = useState('30m')"
);

fs.writeFileSync('src/components/RiskChartWidget.tsx', content);
console.log('Removed 1m button and set default to 30m');
