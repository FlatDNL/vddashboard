const fs = require('fs');
const path = 'src/components/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('Settings,')) {
  content = content.replace("import {\n  Home,", "import {\n  Home,\n  Settings,");
}

const navOld = `const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calendário Econômico', href: '/dashboard/calendario', icon: Calendar },
  { name: 'Demo', href: '/dashboard/demo', icon: SlidersHorizontal },
  { 
    name: 'Macroeconomia', 
    icon: Globe,
    submenus: [
      { name: 'Visão Geral', href: '/dashboard/macroeconomia' },
      { name: 'Cadastro de Ativo', href: '/dashboard/macroeconomia/cadastro' },
    ]
  },
]`;

const navNew = `const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calendário Econômico', href: '/dashboard/calendario', icon: Calendar },
  { name: 'Demo', href: '/dashboard/demo', icon: SlidersHorizontal },
  { 
    name: 'Macroeconomia', 
    icon: Globe,
    submenus: [
      { name: 'Visão Geral', href: '/dashboard/macroeconomia' },
      { name: 'Cadastro de Ativo', href: '/dashboard/macroeconomia/cadastro' },
    ]
  },
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]`;

// Let's just use string replacement carefully to not fail on weird encoding
// Use regex to match the end of the navigation array
const insertRegex = /\]\n\s*\}\,\n\]/; // Not right
// Better to just replace `  },\n]` with `  },\n  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },\n]`
content = content.replace("    ]\n  },\n]", "    ]\n  },\n  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },\n]");

fs.writeFileSync(path, content, 'utf8');
