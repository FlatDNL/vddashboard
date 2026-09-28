const fs = require('fs');

const path = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// I need to add Settings icon
if (!content.includes('Settings')) {
  content = content.replace("import { Activity, Menu, X, Calendar as CalendarIcon } from 'lucide-react'", "import { Activity, Menu, X, Calendar as CalendarIcon, Settings } from 'lucide-react'");
}

const menuStart = content.indexOf('const menuItems = [');
if (menuStart > -1) {
  const insertText = `
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },`;
  
  // Find where the array closes
  const targetText = `  { name: 'Calendário Econômico', href: '/dashboard/calendario', icon: CalendarIcon },
]`
  
  const replacement = `  { name: 'Calendário Econômico', href: '/dashboard/calendario', icon: CalendarIcon },
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]`
  content = content.replace(targetText, replacement);
}

fs.writeFileSync(path, content, 'utf8');
