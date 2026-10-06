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
    const dxyParam = searchParams.get('dxy')
    const baseAjuste = baseParam ? parseFloat(baseParam) : null
    const manualDxy = dxyParam !== null && dxyParam !== '' ? parseFloat(dxyParam) : null

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
    
    // Read from profit_status.json
    let rtdFechamento = null;
    let rtdAjuste = null;
    try {
      const statusPath = path.join(process.cwd(), 'profit_status.json');
      if (fs.existsSync(statusPath)) {
        const fileData = fs.readFileSync(statusPath, 'utf8');
        const json = JSON.parse(fileData);
        if (json.fechamentoAnterior !== undefined && json.fechamentoAnterior !== null) rtdFechamento = json.fechamentoAnterior;
        if (json.ajusteAnterior !== undefined && json.ajusteAnterior !== null) rtdAjuste = json.ajusteAnterior;
      }
    } catch (e) {}

    // 1. Base Inicial (Fechamento/Ajuste do Dólar)
    const fechamentoAnterior = rtdFechamento || baseAjuste || ((brl?.prev || brl?.price || 5.400) * 1000)
    const justo = rtdAjuste || baseAjuste || fechamentoAnterior

    // 2. Dólar Projetado (Preço Justíssimo de Abertura)
    // Fórmula do Frajola: Base * (1 + (Δ% DXY / 100))
    const dxyPctUsado = manualDxy !== null ? manualDxy : (dxy?.pct || 0)
    const justissimo = justo * (1 + (dxyPctUsado / 100))

    // 3. Faixa da Madrugada (Máxima e Mínima Estimadas)
    const maxima = justo + 34.5
    const minima = justo - 35.5

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
      fechamentoAnterior,
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

