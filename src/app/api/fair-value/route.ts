import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()
export const revalidate = 0

async function fetchWDO() {
  const TradingView = require('@mathieuc/tradingview');
  const client = new TradingView.Client();
  const chart = new client.Session.Chart();
  
  chart.setMarket('BMFBOVESPA:WDO1!', { timeframe: 'D', range: 5 });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.end();
      reject(new Error('TV timeout'));
    }, 5000);

    chart.onUpdate(() => {
      if (!chart.periods || chart.periods.length < 2) return;
      clearTimeout(timeout);
      
      const current = chart.periods[0];
      const previousClose = chart.periods[1].close;
      
      client.end();
      resolve({
        atual: current.close,
        justo: previousClose // O Ajuste/Fechamento do dia anterior da B3
      });
    });

    chart.onError((err: any) => {
      clearTimeout(timeout);
      client.end();
      reject(err);
    });
  });
}

export async function GET() {
  try {
    // 1. Busca os dados Macro do Yahoo Finance
    const symbols = ['DX-Y.NYB', 'MXN=X', 'ZAR=X', 'CLP=X']
    const quotes = await yahooFinance.quote(symbols)
    
    const data: Record<string, any> = {}
    quotes.forEach(q => {
      data[q.symbol] = {
        pct: q.regularMarketChangePercent
      }
    })

    // 2. Busca o Fechamento real do WDO na B3 pelo TradingView
    const wdo: any = await fetchWDO();
    
    const justo = wdo.justo;
    const atual = wdo.atual;

    // 3. Cálculos da Planilha (Frajola)
    const casado = 2.5 // Juro diário embutido (aproximado)
    const justissimo = justo + casado

    // Amplitude de 0.67% baseada no Justo
    const variacaoPontos = justo * 0.00665
    const maxima = justo + variacaoPontos
    const minima = justo - variacaoPontos

    // 4. Viés Macro
    const dxy = data['DX-Y.NYB']
    const mxn = data['MXN=X']?.pct || 0
    const zar = data['ZAR=X']?.pct || 0
    const clp = data['CLP=X']?.pct || 0
    const emAvg = (mxn + zar + clp) / 3
    const macroBias = (dxy.pct * 0.4) + (emAvg * 0.6)

    let status = 'NEUTRO'
    if (macroBias > 0.1) status = 'COMPRA'
    if (macroBias < -0.1) status = 'VENDA'

    return NextResponse.json({
      timestamp: Date.now(),
      atual,
      justo,
      justissimo,
      maxima,
      minima,
      status,
      metrics: {
        dxyPct: dxy.pct,
        emPct: emAvg
      }
    })
  } catch (error) {
    console.error('Fair Value Error', error)
    return NextResponse.json({ error: 'Failed to calculate fair value' }, { status: 500 })
  }
}
