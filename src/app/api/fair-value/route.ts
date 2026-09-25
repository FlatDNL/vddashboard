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
    const dxy = data['DX-Y.NYB']
    
    // Média da variação dos pares emergentes (%)
    const mxn = data['MXN=X']?.pct || 0
    const zar = data['ZAR=X']?.pct || 0
    const clp = data['CLP=X']?.pct || 0
    const emAvg = (mxn + zar + clp) / 3

    // Preço Justíssimo: Peso 40% DXY (Macro Global) e 60% Cesta Emergente (Fluxo de Risco)
    const fairPctChange = (dxy.pct * 0.4) + (emAvg * 0.6)
    
    const fairPrice = brl.prev * (1 + (fairPctChange / 100))
    const currentPrice = brl.price
    
    const difference = currentPrice - fairPrice
    const distortionPct = (difference / fairPrice) * 100

    let status = 'NEUTRO'
    if (distortionPct > 0.15) status = 'CARO'
    if (distortionPct < -0.15) status = 'BARATO'

    return NextResponse.json({
      timestamp: Date.now(),
      current: currentPrice,
      fair: fairPrice,
      prev: brl.prev,
      distortion: difference,
      distortionPct: distortionPct,
      status: status,
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
