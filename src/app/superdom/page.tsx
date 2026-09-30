'use client'

import { useState, useEffect, useRef } from 'react'
import { useMarcacoesStore } from '@/store/marcacoes'
import { fetchMarcacoes } from '@/app/dashboard/operacional/marcacoes/actions'
import { useMarketParamsStore } from '@/store/marketParams'

export default function SuperDOMPage() {
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [ticker, setTicker] = useState('WDOV26')
  
  // Pegando as marcações do Zustand
  const { marcacoes, setMarcacoes } = useMarcacoesStore()
  const { manualFechamento, manualDxyPct } = useMarketParamsStore()
  const [systemPoints, setSystemPoints] = useState<any[]>([])

  useEffect(() => {
    fetchMarcacoes().then(data => setMarcacoes(data as any))
    
    // Fetch Fair Value to draw system lines
    fetch('/api/fair-value')
      .then(res => res.json())
      .then(data => {
          const baseJusto = manualFechamento !== null ? manualFechamento : data.justo
          const dxyVar = manualDxyPct !== null ? manualDxyPct : data.metrics.dxyPct

          const justissimoFinal = baseJusto * (1 + (dxyVar / 100))
          const maximaFinal = baseJusto + 34.5
          const minimaFinal = baseJusto - 35.5
          
          setSystemPoints([
            { preco: maximaFinal, descricao: 'MÃXIMA ESTIMADA', importancia: 'Alta' },
            { preco: baseJusto, descricao: 'AJUSTE ANTERIOR (Base)', importancia: 'Média' },
            { preco: justissimoFinal, descricao: 'JUSTÃSSIMO MACRO', importancia: 'Alta' },
            { preco: minimaFinal, descricao: 'MÃNIMA ESTIMADA', importancia: 'Alta' }
          ])
      })
      .catch(e => console.error(e))
  }, [manualFechamento, manualDxyPct])
  
  // Combine user markers with system generated lines
  const allMarkers = [...marcacoes]
  systemPoints.forEach(sp => {
    // Round to nearest tick (0.5) to fit the grid perfectly
    const rounded = Math.round(sp.preco * 2) / 2
    if (!allMarkers.find(m => m.preco === rounded)) {
      allMarkers.push({ id: 'sys_'+sp.descricao, preco: rounded, descricao: sp.descricao, importancia: sp.importancia })
    }
  })

  // Controle de rolagem e centralização
  const [basePrice, setBasePrice] = useState<number>(0)
  const [centerPrice, setCenterPrice] = useState<number>(0)
  
  // Status de conexÃ£o
  const [wsConnected, setWsConnected] = useState<boolean>(false)
  const [profitConnected, setProfitConnected] = useState<boolean>(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<{ [key: string]: HTMLDivElement }>({})

  // Conexão com WebSocket para pegar a cotação real
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
          const savedTicker = localStorage.getItem('profit_ticker')
          if (savedTicker && ws) {
            ws.send(JSON.stringify({ action: 'set_ticker', ticker: savedTicker }))
          }
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'status') {
              setProfitConnected(data.profitConnected);
            }
            if (data.type === 'market_data' && data.symbol === 'WDO$N') {
              setCurrentPrice(data.last);
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setWsConnected(false);
            setProfitConnected(false);
            reconnectTimer = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = () => {
          if (ws && ws.readyState === WebSocket.OPEN) ws.close();
        };
      } catch (e) {}
    };

    connectWs();
    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  // 1. Inicializa a base do DOM no primeiro preço recebido
  useEffect(() => {
    if (currentPrice > 0 && basePrice === 0) {
      const rounded = Math.round(currentPrice * 2) / 2;
      setBasePrice(rounded);
      setCenterPrice(rounded);
    }
  }, [currentPrice, basePrice]);

  // 2. Se o preço se mover 8 ticks (4 pontos) longe do centro atual, centraliza de novo
  useEffect(() => {
    if (basePrice === 0) return;
    const roundedCurrent = Math.round(currentPrice * 2) / 2;
    const diffTicks = Math.abs(roundedCurrent - centerPrice) / 0.5;

    if (diffTicks >= 8) {
      setCenterPrice(roundedCurrent);
    }
  }, [currentPrice, centerPrice, basePrice]);

  // 3. Função para rolar até um preço específico
  const scrollToPrice = (price: number, behavior: ScrollBehavior = 'smooth') => {
    const el = rowRefs.current[price.toFixed(2)];
    if (el && containerRef.current) {
      const container = containerRef.current;
      const elOffset = el.offsetTop;
      const centerPos = elOffset - (container.clientHeight / 2) + (el.clientHeight / 2);
      container.scrollTo({ top: centerPos, behavior });
    }
  };

  // 4. Executa a rolagem quando o centro muda
  useEffect(() => {
    if (centerPrice > 0) {
      scrollToPrice(centerPrice, 'smooth');
    }
  }, [centerPrice]);

  // 5. Centraliza instantaneamente quando a base Ã© carregada na primeira vez
  useEffect(() => {
    if (basePrice > 0) {
      setTimeout(() => scrollToPrice(basePrice, 'auto'), 50);
    }
  }, [basePrice]);

  // 6. CentralizaÃ§Ã£o automÃ¡tica a cada 10 segundos
  const currentPriceRef = useRef(currentPrice);
  useEffect(() => {
    currentPriceRef.current = currentPrice;
  }, [currentPrice]);

  useEffect(() => {
    const interval = setInterval(() => {
      const p = currentPriceRef.current;
      if (p > 0) {
        const roundedCurrent = Math.round(p * 2) / 2;
        setCenterPrice(roundedCurrent);
        scrollToPrice(roundedCurrent, 'smooth');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Gera uma lista fixa de valores
  const ticks = [];
  for (let i = 7000; i >= 3000; i -= 0.5) {
    ticks.push(i);
  }

  const formatPrice = (val: number) => val.toFixed(2).replace('.', ',');

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-xs font-mono select-none overflow-hidden text-gray-300">
      
      {/* Top Tag indicating Profit Status */}
      <div className="absolute top-1 left-2 z-20 flex gap-2 pointer-events-none">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-md ${
          wsConnected && profitConnected 
            ? 'bg-green-600/90 text-white border border-green-500' 
            : 'bg-red-600/90 text-white border border-red-500'
        }`}>
          {wsConnected && profitConnected ? 'PROFIT ON' : 'PROFIT OFF'}
        </span>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[100px_1fr] bg-[#1a1a1a] border-b border-[#333] text-[10px] text-gray-400 font-semibold sticky top-0 z-10 shadow-md">
        <div className="text-center py-1.5 border-r border-[#333]">
          Preço
        </div>
        <div className="px-3 py-1.5">
          Descrição
        </div>
      </div>

      {/* DOM Rows */}
      <div ref={containerRef} className="flex-1 overflow-y-auto no-scrollbar relative bg-[#0a0a0a]">
        <div className="w-full pb-20 pt-20">
          {ticks.map((priceVal) => {
            const roundedCurrent = currentPrice > 0 ? Math.round(currentPrice * 2) / 2 : 0;
            const isCurrent = priceVal === roundedCurrent;
            const marcacao = allMarkers.find(m => m.preco === priceVal);
            
            let descColorClass = 'text-gray-500';
            if (marcacao) {
              if (marcacao.importancia === 'Alta') descColorClass = 'text-red-500';
              else if (marcacao.importancia === 'Média') descColorClass = 'text-yellow-500';
              else if (marcacao.importancia === 'Baixa') descColorClass = 'text-blue-500';
            }
            
            return (
              <div 
                key={priceVal} 
                ref={(el) => {
                  if (el) rowRefs.current[priceVal.toFixed(2)] = el;
                }}
                className={`grid grid-cols-[100px_1fr] group hover:brightness-110 cursor-pointer border-b ${
                  marcacao && marcacao.id.startsWith('sys_') ? 'border-[#333]' : 'border-[#111]'
                }`}
              >
                {/* Price Column */}
                <div className={`text-center py-1 border-r border-[#111] font-bold transition-colors ${
                  isCurrent ? 'bg-[#555] text-white border border-gray-400 z-10 shadow-inner' : 
                  'bg-[#222] text-gray-300'
                }`}>
                  {formatPrice(priceVal)}
                </div>

                {/* Descrição Column */}
                <div className={`px-3 py-1 flex items-center justify-between transition-colors ${isCurrent ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]'}`}>
                  <span className={`text-sm font-bold tracking-wide ${descColorClass}`}>
                    {marcacao ? marcacao.descricao : ''}
                  </span>
                  {isCurrent && <span className="text-gray-500 italic text-[10px] ml-2">Atual</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Custom styles to hide scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}


