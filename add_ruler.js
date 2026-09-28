const fs = require('fs');

const pathStr = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

if (!content.includes('OperationalRulerWidget')) {
  content = content.replace("import { FairValueWidget } from '@/components/FairValueWidget'", "import { FairValueWidget } from '@/components/FairValueWidget'\nimport { OperationalRulerWidget } from '@/components/OperationalRulerWidget'");

  const insertTarget = `<FairValueWidget />
        </div>`;
  
  const replacement = `<FairValueWidget />
        </div>
        
        <div className="grid grid-cols-2 gap-6 w-full items-start">
          <div className="col-span-1">
            <OperationalRulerWidget />
          </div>
        </div>`;

  content = content.replace(insertTarget, replacement);
  fs.writeFileSync(pathStr, content, 'utf8');
}
