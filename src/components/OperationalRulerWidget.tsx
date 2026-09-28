"use client"

import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Activity, RefreshCw } from 'lucide-react'
import { useNotificationStore } from '@/store/notifications'
import { useMarcacoesStore } from '@/store/marcacoes'
import { fetchMarcacoes } from '@/app/dashboard/operacional/marcacoes/actions'

type RulerPoint = {
  id: string
  label: string
  value: number
  type: 'resistance' | 'support' | 'neutral'
  strength: 'Forte' | 'Médio' | 'Institucional' | 'Equilíbrio'
}

export function OperationalRulerWidget() {
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [points, setPoints] = useState<RulerPoint[]>([])
  const { marcacoes } = useMarcacoesStore()
  const [loading, setLoading] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  const [profitDdeConnected, setProfitDdeConnected] = useState(false)

  // Função para formatar os pontos
  const formatPts = (val: number) => {
    return (Math.round(val * 2) / 2).toFixed(1).replace('.', ',')
  }

  // 1. Busca os Níveis Iniciais da API de Fair Value
  useEffect(() => {
    let isMounted = true

    async function fetchPoints() {
      try {
        fetchMarcacoes().then(d => useMarcacoesStore.getState().setMarcacoes(d as any));
        const res = await fetch('/api/fair-value')
        if (res.ok && isMounted) {
          const data = await res.json()
          
          // Construindo a Escada
          const newPoints: RulerPoint[] = [
            { id: 'max', label: 'MÁXIMA ESTIMADA', value: data.maxima, type: 'resistance', strength: 'Forte' },
            { id: 'ajuste', label: 'AJUSTE ANTERIOR (Base)', value: data.justo, type: 'resistance', strength: 'Institucional' },
            { id: 'justissimo', label: 'JUSTÍSSIMO MACRO', value: data.justissimo, type: 'neutral', strength: 'Equilíbrio' },
            { id: 'min', label: 'MÍNIMA ESTIMADA', value: data.minima, type: 'support', strength: 'Forte' },
          ]
          
          // Se o preço atual for maior que o Justo, o Justo vira Suporte, etc. 
          // O tipo será reavaliado depois com base no preço atual.
          
          setPoints(newPoints)
          // Se não houver WebSocket ainda, usa o Atual da API como fallback inicial
          if (currentPrice === 0) {
             setCurrentPrice(data.atual)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPoints()
    const interval = setInterval(fetchPoints, 60000) // Atualiza os níveis a cada 1 min
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // 2. Conexão REAL com o WebSockets do Profit Pro (profit_bridge.py)
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
            if (data.profitConnected !== undefined) {
              setProfitDdeConnected(data.profitConnected);
            }
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
  }, [])

  // 3. Alerta de Rolagem de Contrato (Final do Mês)
  useEffect(() => {
    const checkRollover = () => {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const daysLeft = Math.floor((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Faltando 3 dias ou menos para virar o mês, avisa o usuário (pois pode cair num final de semana)
      if (daysLeft <= 3) {
        const lastAlert = localStorage.getItem('last_rollover_alert');
        const todayStr = today.toISOString().split('T')[0];
        
        if (lastAlert !== todayStr) {
          useNotificationStore.getState().addNotification({
            title: 'Rolagem de Contrato (WDO)',
            message: 'O mês está acabando! O Dólar Futuro faz rolagem no primeiro dia útil do mês. Lembre-se de atualizar o código do ativo na aba de Configurações do seu painel.',
            type: 'warning'
          });
          localStorage.setItem('last_rollover_alert', todayStr);
        }
      }
    };
    
    // Roda com um pequeno delay para garantir que a store já montou no cliente
    setTimeout(checkRollover, 2000);
  }, []);

  if (loading || points.length === 0) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 flex items-center justify-center min-h-[400px] animate-pulse">
        <span className="text-slate-500 text-sm">Carregando Régua Operacional...</span>
      </div>
    )
  }

  // Reavalia Suporte/Resistência baseado no preço atual e ordena do maior para o menor
  const evaluatedPoints = [...points, ...marcacoes.map(m => ({ id: m.id, label: m.descricao.toUpperCase(), value: m.preco, type: 'neutral' as const, strength: (m.importancia === 'Alta' ? 'Forte' : m.importancia === 'Média' ? 'Médio' : 'Equilíbrio') as any }))].map(p => ({
    ...p,
    // Se o preço está abaixo do ponto, o ponto é resistência (acima dele). Se o preço está acima, o ponto é suporte.
    type: currentPrice < p.value ? 'resistance' : 'support'
  })).sort((a, b) => b.value - a.value) // Maior valor no topo

  return (
    <div className="bg-[#0b1120] rounded-2xl border border-[#1e293b] flex flex-col h-full overflow-hidden min-h-[450px]">
      {/* Header */}
      <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-blue-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Régua Operacional WDO</h2>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected && profitDdeConnected ? (
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
          )}
        </div>
      </div>

      {/* Régua */}
      <div className="flex-1 p-4 flex flex-col relative overflow-hidden bg-gradient-to-b from-red-500/5 via-[#0b1120] to-emerald-500/5">
        
        <div className="absolute left-8 top-4 bottom-4 w-px bg-[#1e293b]/50 z-0"></div>

        <div className="flex-1 flex flex-col justify-center gap-1 relative z-10">
          
          {/* Loop para desenhar os pontos. Inserimos a linha do PREÇO ATUAL no lugar correto */}
          {(() => {
            const elements = []
            let priceInserted = false

            evaluatedPoints.forEach((point, idx) => {
              // Verifica se deve inserir a linha do preço atual antes deste ponto
              if (!priceInserted && currentPrice >= point.value) {
                elements.push(
                  <div key="current-price" className="relative flex items-center gap-4 my-3 group">
                    <div className="absolute left-0 right-0 h-[1px] bg-blue-500/40 w-full z-0 group-hover:bg-blue-400 transition-colors shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-[#0b1120] z-10 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.8)] flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                    <div className="z-10 bg-blue-600 px-3 py-1.5 rounded-lg border border-blue-400 shadow-lg flex items-center gap-3">
                      <span className="text-xs font-bold text-white tracking-widest">WDO ATUAL</span>
                      <span className="text-base font-black text-white font-mono">{formatPts(currentPrice)}</span>
                    </div>
                  </div>
                )
                priceInserted = true
              }

              // O Ponto da Régua
              const isRes = point.type === 'resistance'
              const dist = Math.abs(currentPrice - point.value)
              const color = isRes ? 'text-red-400' : 'text-emerald-400'
              const bgBadge = isRes ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'

              elements.push(
                <div key={point.id} className="relative flex items-center gap-4 py-2 hover:bg-[#1e293b]/30 rounded-lg transition-colors px-2 -mx-2">
                  <div className={`w-2 h-2 rounded-full ${isRes ? 'bg-red-500/50' : 'bg-emerald-500/50'} ml-1 z-10 shrink-0`}></div>
                  <div className="flex-1 flex items-center justify-between">
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold font-mono ${color}`}>{formatPts(point.value)}</span>
                        <span className="text-xs font-semibold text-slate-300">{point.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-medium">[{point.strength}]</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${bgBadge} ${color} flex items-center gap-1`}>
                         {isRes ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                         {formatPts(dist)} pts
                       </span>
                    </div>

                  </div>
                </div>
              )
            })

            // Se o preço for menor que o último ponto, insere no final
            if (!priceInserted) {
                elements.push(
                  <div key="current-price" className="relative flex items-center gap-4 my-3 group">
                    <div className="absolute left-0 right-0 h-[1px] bg-blue-500/40 w-full z-0 group-hover:bg-blue-400 transition-colors shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-[#0b1120] z-10 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.8)] flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                    <div className="z-10 bg-blue-600 px-3 py-1.5 rounded-lg border border-blue-400 shadow-lg flex items-center gap-3">
                      <span className="text-xs font-bold text-white tracking-widest">WDO ATUAL</span>
                      <span className="text-base font-black text-white font-mono">{formatPts(currentPrice)}</span>
                    </div>
                  </div>
                )
            }

            return elements
          })()}

        </div>
      </div>
    </div>
  )
}



