import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()
export const revalidate = 0

export async function GET() {
  try {
    const symbols = ['BRL=X', 'DX-Y.NYB', 'MXN=X', 'ZAR=X', 'CLP=X']
    const quotes = await yahooFinance.quote(symbols)
    
    const data: Record<string, any> = {}
    quotes.forEach(q => {
      data[q.symbol] = {
        price: q.regularMarketPrice,
        prev: q.regularMarketPreviousClose,
        pct: q.regularMarketChangePercent
      }
    })

    const brl = data['BRL=X']
    
    // 1. Justo: Baseado no fechamento anterior convertido para pontos WDO
    // Ex: 5.1836 -> 5183.6
    const justo = brl.prev * 1000

    // 2. Justíssimo: Justo + Casado (Aproximadamente 2.5 pontos de juros diários)
    const casado = 2.5 
    const justissimo = justo + casado

    // 3. Máxima e Mínima: Desvio padrão de ~0.67% (Aprox 34.5 - 35 pontos)
    const variacaoPontos = justo * 0.00665 // 0.665%
    const maxima = justo + variacaoPontos
    const minima = justo - variacaoPontos

    // Preço atual do Spot em pontos (aproximação do WDO)
    const atual = brl.price * 1000

    // Calcula o viés macro (DXY e Emergentes) apenas para o status
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
