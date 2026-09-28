const fs = require('fs');

const path = 'src/components/Header.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetBell = `<button className="text-slate-400 hover:text-white relative transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0b1120]" />
        </button>`;

if (content.includes(targetBell)) {
  content = content.replace(targetBell, `<NotificationBell />`);
  content = content.replace("import { Bell, Moon } from 'lucide-react'", "import { Moon } from 'lucide-react'\nimport { NotificationBell } from './NotificationBell'");
  fs.writeFileSync(path, content, 'utf8');
  console.log("Successfully replaced bell with NotificationBell in Header.tsx");
} else {
  console.log("Could not find the target bell button in Header.tsx");
}
