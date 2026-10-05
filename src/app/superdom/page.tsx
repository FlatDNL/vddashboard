'use client'

import { useState, useEffect, useRef } from 'react'
import { useMarcacoesStore } from '@/store/marcacoes'
import { fetchMarcacoes } from '@/app/dashboard/operacional/marcacoes/actions'
import { useMarketParamsStore } from '@/store/marketParams'

export default function SuperDOMPage() {
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [ticker, setTicker] = useState('WDOV26')
  
  const { marcacoes, setMarcacoes } = useMarcacoesStore()
  const { manualFechamento, manualDxyPct, setManualParams, fechamentoAnteriorReal } = useMarketParamsStore()
  const [systemPoints, setSystemPoints] = useState<any[]>([])
  
  // Indicator States
  const [showIndicatorsModal, setShowIndicatorsModal] = useState(false)
  const [freqIndicatorEnabled, setFreqIndicatorEnabled] = useState(false)
  const [fechamentoParaFreq, setFechamentoParaFreq] = useState<number>(0)

  useEffect(() => {
    fetchMarcacoes().then(data => setMarcacoes(data as any))
    
    // Fetch Fair Value to draw system lines
    fetch('/api/fair-value')
      .then(res => res.json())
      .then(data => {
          const baseJusto = manualFechamento !== null ? manualFechamento : data.justo
          const dxyVar = manualDxyPct !== null ? manualDxyPct : data.metrics.dxyPct

          setFechamentoParaFreq(fechamentoAnteriorReal || data.fechamentoAnterior || baseJusto)

          const justissimoFinal = baseJusto * (1 + (dxyVar / 100))
          const maximaFinal = baseJusto + 34.5
          const minimaFinal = baseJusto - 35.5
          
          setSystemPoints([
            { preco: maximaFinal, descricao: 'MÁXIMA ESTIMADA', importancia: 'Alta' },
            { preco: baseJusto, descricao: 'AJUSTE ANTERIOR (Base)', importancia: 'Média' },
            { preco: justissimoFinal, descricao: 'JUSTÍSSIMO MACRO', importancia: 'Alta' },
            { preco: minimaFinal, descricao: 'MÍNIMA ESTIMADA', importancia: 'Alta' }
          ])
      })
      .catch(e => console.error(e))
  }, [manualFechamento, manualDxyPct])
  
  // Combine user markers with system generated lines
  const allMarkers = marcacoes.map(m => ({ ...m }))
  systemPoints.forEach(sp => {
    // Round to nearest tick (0.5) to fit the grid perfectly
    const rounded = Math.round(sp.preco * 2) / 2
    if (!allMarkers.find(m => m.preco === rounded)) {
      allMarkers.push({ id: 'sys_'+sp.descricao, preco: rounded, descricao: sp.descricao, importancia: sp.importancia })
    }
  })
  
  if (freqIndicatorEnabled && fechamentoParaFreq > 0) {
    for (let i = -12; i <= 12; i++) {
      const pct = i * 0.25;
      const preco = fechamentoParaFreq * (1 + (pct / 100));
      const rounded = Math.round(preco * 2) / 2;
      
      const existing = allMarkers.find(m => m.preco === rounded);
      const desc = `Freq ${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;

      if (!existing) {
        allMarkers.push({ 
          id: 'sys_freq_'+i, 
          preco: rounded, 
          descricao: desc, 
          importancia: 'Baixa'
        });
      } else if (i === 0) {
        if (!existing.descricao.includes('0.00%')) {
          existing.descricao = `${existing.descricao} | ${desc}`;
        }
        existing.importancia = 'Baixa';
      }
    }
  }

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
            if (data.type === 'price') {
              setCurrentPrice(data.price);
              setProfitConnected(true);
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

  // 6. Centralização automática a cada 10 segundos usando trigger de estado para evitar closures obsoletas
  const [autoCenterTrigger, setAutoCenterTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAutoCenterTrigger(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoCenterTrigger > 0 && currentPrice > 0) {
      const roundedCurrent = Math.round(currentPrice * 2) / 2;
      setCenterPrice(roundedCurrent);
      scrollToPrice(roundedCurrent, 'smooth');
    }
  }, [autoCenterTrigger]);

  // Gera uma lista fixa de valores
  const ticks = [];
  for (let i = 7000; i >= 3000; i -= 0.5) {
    ticks.push(i);
  }

  const formatPrice = (val: number) => val.toFixed(2).replace('.', ',');

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-xs font-mono select-none overflow-hidden text-gray-300">
      
      {/* Top Tag indicating Profit Status */}
      <div className="absolute top-1 left-2 z-20 flex gap-2">
        <span 
          onClick={() => setAutoCenterTrigger(prev => prev + 1)}
          className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition-transform ${
          wsConnected && profitConnected 
            ? 'bg-green-600/90 text-white border border-green-500' 
            : 'bg-red-600/90 text-white border border-red-500'
        }`}>
          {wsConnected && profitConnected ? 'PROFIT ON' : 'PROFIT OFF'}
        </span>
        <button
          onClick={() => setShowIndicatorsModal(true)}
          className="px-2 py-0.5 rounded text-[10px] font-bold shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition-transform bg-blue-600/90 text-white border border-blue-500"
        >
          INDICADORES
        </button>
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

            // Define bg color for Freq Zones
            let zoneBgPrice = isCurrent ? 'bg-[#555] text-white border border-gray-400 z-10 shadow-inner' : 'bg-[#222] text-gray-300';
            let zoneBgDesc = isCurrent ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]';

            if (freqIndicatorEnabled && fechamentoParaFreq > 0) {
              let isAboveFreq = false;
              let isBelowFreq = false;

              for (let i = -12; i <= 12; i++) {
                const pct = i * 0.25;
                const freqPreco = Math.round((fechamentoParaFreq * (1 + (pct / 100))) * 2) / 2;
                
                if (priceVal > freqPreco && priceVal <= freqPreco + 4) {
                  isAboveFreq = true;
                }
                if (priceVal < freqPreco && priceVal >= freqPreco - 4) {
                  isBelowFreq = true;
                }
              }

              if (isAboveFreq) {
                if (!isCurrent) {
                  zoneBgPrice = 'bg-green-500/20 text-gray-300';
                  zoneBgDesc = 'bg-green-500/10';
                }
              } else if (isBelowFreq) {
                if (!isCurrent) {
                  zoneBgPrice = 'bg-red-500/20 text-gray-300';
                  zoneBgDesc = 'bg-red-500/10';
                }
              }
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
                <div className={`text-center py-1 border-r border-[#111] font-bold transition-colors ${zoneBgPrice}`}>
                  {formatPrice(priceVal)}
                </div>

                {/* Descrição Column */}
                <div className={`px-3 py-1 flex items-center justify-between transition-colors ${zoneBgDesc}`}>
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
      {/* Indicators Modal */}
      {showIndicatorsModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 w-72 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#333] pb-2">
              <h3 className="text-sm font-bold text-gray-200">Indicadores</h3>
              <button 
                onClick={() => setShowIndicatorsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                X
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={freqIndicatorEnabled}
                  onChange={(e) => setFreqIndicatorEnabled(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#222] border-[#444] text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-gray-300 text-xs font-semibold group-hover:text-white transition-colors">
                  Frequência (Base: {fechamentoParaFreq ? fechamentoParaFreq.toFixed(2) : '--'})
                </span>
              </label>

              <div className="text-[10px] text-gray-500 ml-6 leading-tight">
                Traça suporte/resistência a cada 0,25% de variação a partir do valor base.
              </div>
            </div>
            
            <div className="mt-2 flex justify-end">
              <button 
                onClick={() => setShowIndicatorsModal(false)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
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


