const fs = require('fs');

let content = fs.readFileSync('src/components/RiskChartWidget.tsx', 'utf-8');

const newEffect = `
  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      try {
        const res = await fetch(\`/api/risk/history?tf=\${timeframe}\`)
        if (res.ok && isMounted) {
          const data = await res.json()
          setHistory(data)
        }
      } catch (e) {
        console.error('Erro ao carregar histórico', e)
      }
    }

    async function tickEngineAndLoad() {
      // 1. Bate no /api/risk silenciosamente para forçar o motor a calcular o risco atual 
      // e salvar no banco de dados (já que não temos um Cron Job rodando)
      try {
        await fetch('/api/risk')
      } catch (e) {
        // ignora
      }
      
      // 2. Carrega o histórico completo atualizado do banco de dados
      await loadHistory()
    }

    // Busca o histórico inicial
    tickEngineAndLoad()
    
    // Configura o intervalo para bater na API a cada 1 minuto
    const interval = setInterval(tickEngineAndLoad, 60000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [timeframe])
`;

// Regex to replace the entire useEffect
content = content.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[timeframe\]\)/, newEffect.trim());

fs.writeFileSync('src/components/RiskChartWidget.tsx', content);
console.log('Fixed polling logic in Chart');
