const fs = require('fs');

const pathStr = 'src/components/OperationalRulerWidget.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

const targetConnect = `      ws.onopen = () => {
        setWsConnected(true);
        console.log('Conectado ao Profit Bridge!');
      };`;

const newConnect = `      ws.onopen = () => {
        setWsConnected(true);
        console.log('Conectado ao Profit Bridge!');
        
        // Pega o ticker do localStorage e envia pro Python!
        const savedTicker = localStorage.getItem('profit_ticker') || 'WDOZ26';
        ws?.send(JSON.stringify({ action: 'set_ticker', ticker: savedTicker }));
      };`;

content = content.replace(targetConnect, newConnect);
fs.writeFileSync(pathStr, content, 'utf8');
