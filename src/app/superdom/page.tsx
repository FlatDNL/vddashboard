'use client'

import React, { useState, useEffect, useRef } from 'react'

import { useMarcacoesStore } from '@/store/marcacoes'
import { fetchMarcacoes } from '@/app/dashboard/operacional/marcacoes/actions'

export default function SuperDOMPage() {
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [ticker, setTicker] = useState('WDOV26')
  
  // Pegando as marcações do Zustand
  const { marcacoes, setMarcacoes } = useMarcacoesStore()

  useEffect(() => {
    fetchMarcacoes().then(data => setMarcacoes(data as any))
  }, [])
  
  // Controle de rolagem e centralização
  const [basePrice, setBasePrice] = useState<number>(0)
  const [centerPrice, setCenterPrice] = useState<number>(0)
  
  // Status de conexão
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
          const savedTicker = localStorage.getItem('profit_ticker') || 'WDOV26';
          setTicker(savedTicker);
          ws?.send(JSON.stringify({ action: 'set_ticker', ticker: savedTicker }));
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.profitConnected !== undefined) {
              setProfitConnected(data.profitConnected);
            }
            if (data && data.price) {
              setCurrentPrice(data.price);
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setWsConnected(false);
            setProfitConnected(false);
            reconnectTimer = setTimeout(connectWs, 5000);
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

  // 5. Centraliza instantaneamente quando a base é carregada na primeira vez
  useEffect(() => {
    if (basePrice > 0) {
      setTimeout(() => scrollToPrice(basePrice, 'auto'), 50);
    }
  }, [basePrice]);

  // 6. Centralização automática a cada 10 segundos
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

  // Gera uma lista fixa de valores do 7000 ao 3000 (intervalos de 0.5)
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

      {/* Column Headers (Preço e Descrição) */}
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
            const marcacao = marcacoes.find(m => m.preco === priceVal);
            
            // Define a cor do texto baseada na importância
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
                className="grid grid-cols-[100px_1fr] group hover:brightness-110 cursor-pointer border-b border-[#111]"
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

