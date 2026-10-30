import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const yahooFinance = new YahooFinance()

async function getMt5MarketData() {
  try {
    const fluxoPath = path.join(process.cwd(), 'fluxo_ia_status.json')
    if (fs.existsSync(fluxoPath)) {
      const json = JSON.parse(fs.readFileSync(fluxoPath, 'utf8'))
      const age = Date.now() / 1000 - (json.updatedAt || 0)
      if (json.fechamentoAnterior && json.fechamentoAnterior > 0 && age < 60) {
        return {
          fechamentoAnterior: Number(json.fechamentoAnterior),
          precoAtual: json.preco_atual > 0 ? Number(json.preco_atual) : null
        }
      }
    }
  } catch (e) {}

  try {
    const pyCode = [
      'import json, MetaTrader5 as mt5, master_fluxo_ia',
      'if not mt5.initialize(): raise SystemExit(1)',
      'sym = master_fluxo_ia.detectar_simbolo_ativo()',
      'mt5.symbol_select(sym, True)',
      'tick = mt5.symbol_info_tick(sym)',
      'price = float(tick.last if tick and tick.last > 0 else (tick.bid if tick else 0))',
      'fech = float(master_fluxo_ia.obter_fechamento_anterior_mt5(sym))',
      'mt5.shutdown()',
      'print(json.dumps({"fechamentoAnterior": fech, "precoAtual": price}))'
    ].join('; ')
    const { stdout } = await execFileAsync('python', ['-c', pyCode], {
      cwd: process.cwd(),
      timeout: 3000
    })
    const parsed = JSON.parse(stdout.trim())
    if (parsed.fechamentoAnterior > 0) {
      return {
        fechamentoAnterior: Number(parsed.fechamentoAnterior),
        precoAtual: parsed.precoAtual > 0 ? Number(parsed.precoAtual) : null
      }
    }
  } catch (e) {}

  try {
    const fluxoPath = path.join(process.cwd(), 'fluxo_ia_status.json')
    if (fs.existsSync(fluxoPath)) {
      const json = JSON.parse(fs.readFileSync(fluxoPath, 'utf8'))
      if (json.fechamentoAnterior && json.fechamentoAnterior > 0) {
        return {
          fechamentoAnterior: Number(json.fechamentoAnterior),
          precoAtual: json.preco_atual > 0 ? Number(json.preco_atual) : null
        }
      }
    }
  } catch (e) {}

  return { fechamentoAnterior: null, precoAtual: null }
}

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const isUpdate = searchParams.get('update') === 'true'
    const manualDxy = searchParams.get('dxy')
    
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
        pct: q.regularMarketChangePercent,
        high: q.regularMarketDayHigh,
        low: q.regularMarketDayLow
      }
    })

    const brlPrice = data['BRL=X']?.price || 5.400

    const liveDxyPct = data['DX-Y.NYB']?.pct || 0
    const liveSpotPct = data['BRL=X']?.pct || 0
    const mxn = data['MXN=X']?.pct || 0
    const zar = data['ZAR=X']?.pct || 0
    const clp = data['CLP=X']?.pct || 0
    const liveEmAvg = (mxn + zar + clp) / 3

    // Usa cotação ao vivo como padrão e atualiza o baseline caso solicitado ou se for de outro dia
    dxyPct = liveDxyPct
    spotPct = liveSpotPct
    emAvg = liveEmAvg

    if (isUpdate) {
      fs.writeFileSync(baselinePath, JSON.stringify({ dxyPct, spotPct, emAvg, timestamp: Date.now() }))
    } else if (fs.existsSync(baselinePath)) {
      try {
        const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
        const baselineDate = baseline.timestamp ? new Date(baseline.timestamp).toDateString() : ''
        const todayDate = new Date().toDateString()
        if (baselineDate === todayDate) {
          dxyPct = baseline.dxyPct ?? liveDxyPct
          spotPct = baseline.spotPct ?? liveSpotPct
          emAvg = baseline.emAvg ?? liveEmAvg
        } else {
          // Atualiza o baseline antigo automaticamente para o dia atual com os dados ao vivo
          fs.writeFileSync(baselinePath, JSON.stringify({ dxyPct, spotPct, emAvg, timestamp: Date.now() }))
        }
      } catch (e) {}
    }

    if (manualDxy !== null && !isNaN(parseFloat(manualDxy))) {
      dxyPct = parseFloat(manualDxy)
    }

    // Leitura do fechamento do dia anterior diretamente do MetaTrader 5
    const mt5Data = await getMt5MarketData()
    let mt5Fechamento: number | null = mt5Data.fechamentoAnterior
    let rtdAjuste: number | null = null

    if (!mt5Fechamento) {
      try {
        const statusPath = path.join(process.cwd(), 'profit_status.json');
        if (fs.existsSync(statusPath)) {
          const fileData = fs.readFileSync(statusPath, 'utf8');
          const json = JSON.parse(fileData);
          if (json.fechamentoAnterior !== undefined && json.fechamentoAnterior !== null) mt5Fechamento = json.fechamentoAnterior;
          if (json.ajusteAnterior !== undefined && json.ajusteAnterior !== null) rtdAjuste = json.ajusteAnterior;
        }
      } catch (e) {}
    }

    const manualBase = searchParams.get('base')

    // 1. Base Inicial (Fechamento do MetaTrader 5)
    let fechamentoAnterior = mt5Fechamento || 5400
    if (manualBase !== null && !isNaN(parseFloat(manualBase))) {
      fechamentoAnterior = parseFloat(manualBase)
    }
    const ajusteAnterior = rtdAjuste || fechamentoAnterior

    // 2. Dólar Projetado (Preço Justo) de acordo com o PDF do Frajola
    // O PDF manda usar a variação do DXY para projetar a abertura do dólar local
    const justo = fechamentoAnterior * (1 + (dxyPct / 100))
    
    // Justíssimo = Variação pelo Spot (BRL=X) para servir de referência secundária
    const justissimo = fechamentoAnterior * (1 + (spotPct / 100))

    // 3. Conversão da Faixa da Madrugada (Máxima e Mínima)
    // Conforme sua instrução, a Máxima e Mínima são +34 e -34 pontos em relação ao Justo.
    const maxima = justo + 34.0
    const minima = justo - 34.0

    const atual = mt5Data.precoAtual || (brlPrice * 1000)

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

