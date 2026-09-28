const fs = require('fs');

const pathStr = 'src/components/OperationalRulerWidget.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

const oldWsCode = `  // 2. Conexão REAL com o WebSockets do Profit Pro (profit_bridge.py)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connectWs = () => {
      ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        setWsConnected(true);
        console.log('Conectado ao Profit Bridge!');
        
        // Pega o ticker do localStorage e envia pro Python!
        const savedTicker = localStorage.getItem('profit_ticker') || 'WDOZ26';
        ws?.send(JSON.stringify({ action: 'set_ticker', ticker: savedTicker }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.price) {
            setCurrentPrice(data.price);
          }
        } catch (e) {
          console.error("Erro no parse do websocket", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('Desconectado do Profit Bridge. Tentando reconectar em 5s...');
        // Tenta reconectar automaticamente
        reconnectTimer = setTimeout(connectWs, 5000);
      };

      ws.onerror = (err) => {
        console.error('Erro no WebSocket do Profit:', err);
        ws?.close();
      };
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
      }
    };
  }, [])`;

const newWsCode = `  // 2. Conexão REAL com o WebSockets do Profit Pro (profit_bridge.py)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;
    let isUnmounted = false;

    const connectWs = () => {
      if (isUnmounted) return;
      
      try {
        ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
          if (isUnmounted) return;
          setWsConnected(true);
          const savedTicker = localStorage.getItem('profit_ticker') || 'WDOV26';
          ws?.send(JSON.stringify({ action: 'set_ticker', ticker: savedTicker }));
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data && data.price) {
              setCurrentPrice(data.price);
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {
          // Trata o erro silenciosamente sem estourar o overlay vermelho no Next.js
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (e) {}
    };

    connectWs();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null; // Evita disparo de reconexão no desmontar do React
        ws.close();
      }
    };
  }, [])`;

content = content.replace(oldWsCode, newWsCode);

// Se falhou no replace por conta da string do savedTicker ter mudado
if (!content.includes('isUnmounted')) {
  const genericWsRegex = /\/\/ 2\. Conexão REAL com o WebSockets do Profit Pro[^]*?return \(\) => \{[^]*?\}\s*\}, \[\]\)/;
  content = content.replace(genericWsRegex, newWsCode);
}

fs.writeFileSync(pathStr, content, 'utf8');
