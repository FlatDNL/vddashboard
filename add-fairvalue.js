const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf-8');

if (!content.includes('FairValueWidget')) {
  content = content.replace(
    "import { RiskChartWidget } from '@/components/RiskChartWidget'",
    "import { RiskChartWidget } from '@/components/RiskChartWidget'\nimport { FairValueWidget } from '@/components/FairValueWidget'"
  );
  
  content = content.replace(
    "<RiskEngineWidget />",
    "<RiskEngineWidget />\n            <FairValueWidget />"
  );
  
  fs.writeFileSync('src/app/dashboard/page.tsx', content);
  console.log('Added FairValueWidget to Dashboard');
}
