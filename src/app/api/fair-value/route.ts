import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import fs from 'fs'
import path from 'path'

const yahooFinance = new YahooFinance()
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const isUpdate = searchParams.get('update') === 'true'
    
    const baselinePath = path.join(process.cwd(), 'fair_value_baseline.json')
    let dxyPct = 0
    let spotPct = 0
    let emAvg = 0

    // Sempre busca os valores atuais (para o BRL=X live)
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

    const brlPrice = data['BRL=X']?.price || 5.400

    // Se pediu update, salva no JSON as variações percentuais da madrugada
    if (isUpdate) {
      dxyPct = data['DX-Y.NYB']?.pct || 0
      spotPct = data['BRL=X']?.pct || 0
      
      const mxn = data['MXN=X']?.pct || 0
      const zar = data['ZAR=X']?.pct || 0
      const clp = data['CLP=X']?.pct || 0
      emAvg = (mxn + zar + clp) / 3

      fs.writeFileSync(baselinePath, JSON.stringify({ dxyPct, spotPct, emAvg, timestamp: Date.now() }))
    } else {
      // Se não pediu update, lê as variações congeladas da última atualização
      if (fs.existsSync(baselinePath)) {
        try {
          const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
          dxyPct = baseline.dxyPct || 0
          spotPct = baseline.spotPct || 0
          emAvg = baseline.emAvg || 0
        } catch (e) {}
      }
    }

    // Leitura do status da planilha local (Ajuste/Fechamento)
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

    // 1. Base Inicial (Fechamento e Ajuste da Planilha)
    const fechamentoAnterior = rtdFechamento || 5400
    const ajusteAnterior = rtdAjuste || fechamentoAnterior

    // 2. Dólar Projetado (Variação percentual sobre o Fechamento)
    // Justo = Projeção do Fechamento pela variação do Spot (BRL=X)
    const justo = fechamentoAnterior * (1 + (spotPct / 100))
    
    // Justíssimo = Projeção do Fechamento pela variação do DXY
    const justissimo = fechamentoAnterior * (1 + (dxyPct / 100))

    // 3. Faixa da Madrugada (Máxima e Mínima Estimadas)
    const maxima = justo + 33.5
    const minima = justo - 34.0

    const atual = brlPrice * 1000

    let status = 'NEUTRO'
    if (dxyPct > 0.1) status = 'COMPRA'
    if (dxyPct < -0.1) status = 'VENDA'

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
        dxyPct: dxyPct,
        emPct: emAvg
      }
    })
  } catch (error) {
    console.error('Fair Value Error', error)
    return NextResponse.json({ error: 'Failed to calculate fair value' }, { status: 500 })
  }
}

