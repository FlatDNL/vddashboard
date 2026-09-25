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
    
    // 1. JUSTO: Fechamento PTAX/Ajuste do dia anterior em pontos WDO
    const justo = brl.prev * 1000

    // 2. VIÉS MACRO (% Variação combinada de DXY 40% + Emergentes 60%)
    const mxn = data['MXN=X']?.pct || 0
    const zar = data['ZAR=X']?.pct || 0
    const clp = data['CLP=X']?.pct || 0
    const emAvg = (mxn + zar + clp) / 3
    const dxPct = (dxy.pct * 0.4) + (emAvg * 0.6)

    // 3. JUSTÍSSIMO (Dinâmico): Justo + Variação do Viés Macro Noturno/Ao Vivo
    // Fórmula cravada das Lives: Justo + (Justo * % Variação Global)
    const justissimo = justo + (justo * (dxPct / 100))

    // 4. MÁXIMA E MÍNIMA: Ancoradas DIRETAMENTE no JUSTO (+34.5 / -35.5)
    const maxima = justo + 34.5
    const minima = justo - 35.5

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
