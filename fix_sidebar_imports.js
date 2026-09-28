const fs = require('fs');

const pathStr = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

content = content.replace(
  "import { useState } from 'react'",
  "import { useState, useEffect } from 'react'"
);

fs.writeFileSync(pathStr, content, 'utf8');
