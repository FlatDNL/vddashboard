import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()

import fs from 'fs'
import path from 'path'

async function get0850Snapshot(yahooFinance: any) {
  const CACHE_FILE = path.join(process.cwd(), 'snapshot_0850.json')
  
  // Create a date string representing today in BRT
  const now = new Date()
  const brtTime = new Date(now.getTime() - (3 * 60 * 60 * 1000))
  const today = brtTime.toISOString().split('T')[0]
  
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
      if (cache.date === today && cache['BRL=X']) {
        return cache;
      }
    }
  } catch(e) {}

  try {
    const symbols = ['BRL=X', 'DX-Y.NYB', 'MXN=X', 'ZAR=X', 'CLP=X']
    const snapshot: any = { date: today }
    
    for (const sym of symbols) {
      const res = await yahooFinance.chart(sym, { interval: '5m', range: '1d' })
      let targetClose = null;
      if (res.quotes && res.quotes.length > 0) {
         const sorted = res.quotes.sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
         for (const q of sorted) {
            const h = q.date.getUTCHours()
            const m = q.date.getUTCMinutes()
            // 08:50 BRT is usually 11:50 UTC
            if (h < 11 || (h === 11 && m <= 50)) {
               targetClose = q.close || q.open
               break
            }
         }
         if (!targetClose) targetClose = res.quotes[0].close || res.quotes[0].open
      }
      snapshot[sym] = targetClose
    }
    
    // Only cache it if it's PAST 08:50 BRT (so we don't freeze early prices as the 08:50 snapshot)
    if (brtTime.getHours() > 8 || (brtTime.getHours() === 8 && brtTime.getMinutes() >= 50)) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(snapshot), 'utf8')
    }
    
    return snapshot
  } catch(e) {
    console.error("Snapshot error:", e)
    return null;
  }
}

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
    const justo = (brl?.prev || brl?.price || 5.400) * 1000

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

    const atual = (brl?.price || 5.400) * 1000

    let status = 'NEUTRO'
    if (dxPct > 0.1) status = 'COMPRA'
    if (dxPct < -0.1) status = 'VENDA'

    // TESTE 08:50
    let justoTeste = justo;
    let justissimoTeste = justissimo;
    
    const snap = await get0850Snapshot(yahooFinance);
    if (snap && snap['BRL=X'] && snap['DX-Y.NYB']) {
       justoTeste = snap['BRL=X'] * 1000;
       
       const mxn_s = snap['MXN=X'] || 1;
       const zar_s = snap['ZAR=X'] || 1;
       const clp_s = snap['CLP=X'] || 1;
       const dxy_s = snap['DX-Y.NYB'];
       
       const pctMxn = ((data['MXN=X']?.price || mxn_s) - mxn_s) / mxn_s * 100;
       const pctZar = ((data['ZAR=X']?.price || zar_s) - zar_s) / zar_s * 100;
       const pctClp = ((data['CLP=X']?.price || clp_s) - clp_s) / clp_s * 100;
       const pctDxy = ((data['DX-Y.NYB']?.price || dxy.price) - dxy_s) / dxy_s * 100;
       
       const emAvg_s = (pctMxn + pctZar + pctClp) / 3;
       const dxPct_s = (pctDxy * 0.4) + (emAvg_s * 0.6);
       
       justissimoTeste = justoTeste + (justoTeste * (dxPct_s / 100));
    }

    return NextResponse.json({
      timestamp: Date.now(),
      atual,
      justo,
      justissimo,
      maxima,
      minima,
      status,
      justoTeste,
      justissimoTeste,
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
