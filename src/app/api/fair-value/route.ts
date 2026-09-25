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
    
    // 1. FECHAMENTO ANTERIOR (em pontos)
    const fechamento = brl.prev * 1000

    // 2. JUSTO = Fechamento + Carregamento Diário
    const carryCost = 2.5
    const justo = fechamento + carryCost

    // 3. DX / MACRO (Variação % Global: DXY 40% + Emergentes 60%)
    const mxn = data['MXN=X']?.pct || 0
    const zar = data['ZAR=X']?.pct || 0
    const clp = data['CLP=X']?.pct || 0
    const emAvg = (mxn + zar + clp) / 3
    const dxPct = (dxy.pct * 0.4) + (emAvg * 0.6)

    // 4. ABERTURA TEÓRICA / JUSTÍSSIMO = JUSTO * (1 + DX %)
    // Fórmula cravada do print do Frajola: JUSTO * (1 + DX)
    const justissimo = justo * (1 + (dxPct / 100))

    // 5. MÁXIMA E MÍNIMA (Abertura + DELTA e Abertura - DELTA)
    // Fórmula cravada do print do Frajola: MAX = ABERTURA + DELTA, MIN = ABERTURA - DELTA
    const delta = 35.0 // Parâmetro de volatilidade / amplitude em pontos
    const maxima = justissimo + delta
    const minima = justissimo - delta

    const atual = brl.price * 1000

    let status = 'NEUTRO'
    if (dxPct > 0.1) status = 'COMPRA'
    if (dxPct < -0.1) status = 'VENDA'

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
