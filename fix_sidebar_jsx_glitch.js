const fs = require('fs');

const pathStr = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

const targetGlitch = `        )}
      </div>
        )}
      </div>
    </div>
  )
}`;

const fixedTail = `        )}
      </div>
    </div>
  )`

content = content.replace(targetGlitch, fixedTail);
fs.writeFileSync(pathStr, content, 'utf8');
