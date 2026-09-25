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
    
    // 1. Justo: Fechamento PTAX/Ajuste do dia anterior em pontos WDO
    const justo = brl.prev * 1000

    // 2. Viés Macro (% Variação combinada de DXY 40% + Emergentes 60%)
    const mxn = data['MXN=X']?.pct || 0
    const zar = data['ZAR=X']?.pct || 0
    const clp = data['CLP=X']?.pct || 0
    const emAvg = (mxn + zar + clp) / 3
    const macroBias = (dxy.pct * 0.4) + (emAvg * 0.6)

    // 3. Justíssimo (Dinâmico): Justo + Variação do Viés Macro ao vivo
    // Se o mundo estiver caindo, o Justíssimo fica ABAIXO do Justo. Se estiver subindo, fica ACIMA.
    const justissimo = justo + (justo * (macroBias / 100))

    // 4. Máxima (+34.5 pts) e Mínima (-36.0 pts) cravadas da planilha do Fraja
    const maxima = justo + 34.5
    const minima = justo - 36.0

    // Preço Spot Atual em pontos
    const atual = brl.price * 1000

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
