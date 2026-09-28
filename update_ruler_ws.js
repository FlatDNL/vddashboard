const fs = require('fs');

const pathStr = 'src/components/OperationalRulerWidget.tsx';
let content = fs.readFileSync(pathStr, 'utf8');

const simCodeOld = `  // 2. Conexão Simulada com o WebSockets do Profit Pro (Para o Tempo Real do WDO)
  useEffect(() => {
    // Em produção, isso conectará ao script Python local: ws://localhost:8080
    // Como ainda não criamos o script Python, simularemos a variação em tempo real
    setWsConnected(true) // Simula conectado
    
    const simInterval = setInterval(() => {
      setCurrentPrice(prev => {
        if (prev === 0) return prev
        // Simula o WDO oscilando meio ponto a cada segundo para teste visual
        const oscilacao = (Math.random() > 0.5 ? 0.5 : -0.5) * (Math.random() > 0.7 ? 2 : 1)
        return prev + oscilacao
      })
    }, 1500)

    return () => clearInterval(simInterval)
  }, [])`;

const simCodeNew = `  // 2. Conexão REAL com o WebSockets do Profit Pro (profit_bridge.py)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connectWs = () => {
      ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        setWsConnected(true);
        console.log('Conectado ao Profit Bridge!');
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

content = content.replace(simCodeOld, simCodeNew);
fs.writeFileSync(pathStr, content, 'utf8');
