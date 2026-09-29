import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import fs from 'fs'
import path from 'path'

const yahooFinance = new YahooFinance()

export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const baseParam = searchParams.get('base')
    const baseAjuste = baseParam ? parseFloat(baseParam) : null

    const symbols = ['BRL=X', 'DX-Y.NYB', 'MXN=X', 'ZAR=X', 'CLP=X']
    const quotes = await yahooFinance.quote(symbols)
    
    const data: Record<string, any> = {}
    quotes.forEach(q => {
      data[q.symbol] = {
        price: q.regularMarketPrice,
        prev: q.regularMarketPreviousClose,
        pct: q.regularMarketChangePercent,
        high: q.regularMarketDayHigh,
        low: q.regularMarketDayLow
      }
    })

    const brl = data['BRL=X']
    const dxy = data['DX-Y.NYB']
    
    // 1. Fechamento do dia anterior (Referência)
    // Se o usuário passou um baseAjuste (ex: 5233), usa ele. Senão, faz o fallback pro BRL=X
    const fechamentoAnterior = baseAjuste || ((brl?.prev || brl?.price || 5.400) * 1000)

    // O "Preço Justo" passa a ser o Fechamento (base da projeção)
    const justo = fechamentoAnterior

    // 2. Preço Projetado (Preço Justíssimo)
    // Fórmula do Frajola: Fechamento * (1 + (Variação DXY / 100))
    const justissimo = justo * (1 + ((dxy?.pct || 0) / 100))

    // 3. Faixa da Madrugada (Máxima e Mínima)
    // Ajustado para offsets exatos baseados na B3 (+35 e -36)
    const maxima = justo + 35
    const minima = justo - 36

    const atual = (brl?.price || 5.400) * 1000

    // Variação dos emergentes apenas para métricas do painel
    const mxn = data['MXN=X']?.pct || 0
    const zar = data['ZAR=X']?.pct || 0
    const clp = data['CLP=X']?.pct || 0
    const emAvg = (mxn + zar + clp) / 3

    let status = 'NEUTRO'
    if ((dxy?.pct || 0) > 0.1) status = 'COMPRA'
    if ((dxy?.pct || 0) < -0.1) status = 'VENDA'

    return NextResponse.json({
      timestamp: Date.now(),
      atual,
      justo,
      justissimo,
      maxima,
      minima,
      status,
      metrics: {
        dxyPct: dxy?.pct || 0,
        emPct: emAvg
      }
    })
  } catch (error) {
    console.error('Fair Value Error', error)
    return NextResponse.json({ error: 'Failed to calculate fair value' }, { status: 500 })
  }
}

