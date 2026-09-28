const fs = require('fs');

const pathStr = 'src/components/OperationalRulerWidget.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

// Add state profitDdeConnected
if (!content.includes('profitDdeConnected')) {
  content = content.replace(
    "const [wsConnected, setWsConnected] = useState(false)",
    "const [wsConnected, setWsConnected] = useState(false)\n  const [profitDdeConnected, setProfitDdeConnected] = useState(false)"
  );

  // Update ws.onmessage
  const oldOnMessage = `        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data && data.price) {
              setCurrentPrice(data.price);
            }
          } catch (e) {}
        };`;

  const newOnMessage = `        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.profitConnected !== undefined) {
              setProfitDdeConnected(data.profitConnected);
            }
            if (data && data.price) {
              setCurrentPrice(data.price);
            }
          } catch (e) {}
        };`;

  content = content.replace(oldOnMessage, newOnMessage);

  // Update header badge
  const oldHeaderBadge = `{wsConnected ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PROFIT AO VIVO
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
              <RefreshCw size={10} className="animate-spin" />
              CONECTANDO PROFIT...
            </span>
          )}`;

  const newHeaderBadge = `{wsConnected && profitDdeConnected ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PROFIT AO VIVO
            </span>
          ) : wsConnected && !profitDdeConnected ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              ABRA O PROFIT PRO
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
              <RefreshCw size={10} className="animate-spin" />
              PONTE DESCONECTADA
            </span>
          )}`;

  content = content.replace(oldHeaderBadge, newHeaderBadge);
  fs.writeFileSync(pathStr, content, 'utf8');
}
