import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  let source = searchParams.get('source') // 'yahoo' ou 'tradingview'

  if (!symbol) {
    return NextResponse.json({ error: 'Símbolo não fornecido' }, { status: 400 })
  }

  // Auto-detect TradingView symbol format (e.g. CAPITALCOM:CN50)
  if (symbol.includes(':')) {
    source = 'tradingview'
  }

  try {
    if (source === 'yahoo') {
      // Busca cotação no Yahoo Finance
      const quote = await yahooFinance.quote(symbol)
      
      return NextResponse.json({
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        currency: quote.currency,
        timestamp: quote.regularMarketTime
      })
    } else if (source === 'tradingview') {
      // Usa a API não-oficial do TradingView
      const TradingView = require('@mathieuc/tradingview');
      const client = new TradingView.Client();
      const chart = new client.Session.Chart();
      
      chart.setMarket(symbol, {
        timeframe: 'D',
      });

      const data: any = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          client.end();
          reject(new Error('TradingView timeout'));
        }, 5000);

        chart.onUpdate(() => {
          if (!chart.periods[0]) return;
          clearTimeout(timeout);
          const current = chart.periods[0];
          
          // O preço de fechamento atual
          const price = current.close;
          
          // Pega o período anterior para calcular a variação correta (em relação ao fechamento anterior)
          let previousClose = current.open;
          if (chart.periods.length > 1) {
            previousClose = chart.periods[1].close;
          }
          
          const change = price - previousClose;
          const changePercent = (change / previousClose) * 100;

          client.end();
          resolve({
            price,
            change,
            changePercent
          });
        });

        chart.onError((err: any) => {
          clearTimeout(timeout);
          client.end();
          reject(err);
        });
      });

      return NextResponse.json({
        symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        timestamp: new Date()
      })
    } else {
      return NextResponse.json({ error: 'Fonte de dados inválida' }, { status: 400 })
    }

  } catch (error) {
    console.error(`Erro ao buscar cotação para ${symbol}:`, error)
    return NextResponse.json({ error: 'Falha ao buscar cotação' }, { status: 500 })
  }
}
