const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/macroeconomia/cadastro/page.tsx', 'utf-8');
content = content.replace(
  "const [novoAtivo, setNovoAtivo] = useState({ codigo: '', nome: '', fonte: 'yahoo' as const })",
  "const [novoAtivo, setNovoAtivo] = useState({ codigo: '', nome: '', fonte: 'yahoo' as 'yahoo' | 'tradingview' })"
);
fs.writeFileSync('src/app/dashboard/macroeconomia/cadastro/page.tsx', content);
console.log('Fixed type in cadastro page');
