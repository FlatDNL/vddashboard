const fs = require('fs');

const path = 'src/components/Header.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('NotificationBell')) {
  content = content.replace(
    "import NextEventAlertWidget from './NextEventAlertWidget'",
    "import NextEventAlertWidget from './NextEventAlertWidget'\nimport { NotificationBell } from './NotificationBell'"
  );
  
  // Replace the placeholder bell icon in Header
  // It has: <button className="relative p-2 rounded-full hover:bg-[#1e293b] transition-colors text-slate-400 hover:text-white">
  //           <Bell size={20} />
  //           <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
  //         </button>
  const targetBell = `<button className="relative p-2 rounded-full hover:bg-[#1e293b] transition-colors text-slate-400 hover:text-white">
          <Bell size={20} />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>`;
        
  if (content.includes(targetBell)) {
    content = content.replace(targetBell, `<NotificationBell />`);
  } else {
    // try a more generic replace if formatting differs
    const genericBellRegex = /<button[^>]*>\s*<Bell size=\{20\} \/>\s*<span[^>]*><\/span>\s*<\/button>/;
    content = content.replace(genericBellRegex, `<NotificationBell />`);
  }
}

fs.writeFileSync(path, content, 'utf8');
