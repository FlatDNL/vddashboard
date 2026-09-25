import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { createClient } from '@supabase/supabase-js'
import { getAssetZScore, normalizeScore } from '@/lib/risk-engine'

const yahooFinance = new YahooFinance()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export const revalidate = 60

export async function GET() {
  try {
    const symbols = [
      '^GSPC', '^VIX', '^VIX3M', 'HYG', 'LQD', 
      '^TNX', 'DX-Y.NYB', 'BTC-USD', 'HG=F',
      '^BVSP', 'EWZ', 'BRL=X'
    ]

    // Busca cotações ao vivo
    const quotes = await Promise.allSettled(symbols.map(s => yahooFinance.quote(s)))
    const data: Record<string, number> = {}
    
    quotes.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        data[symbols[index]] = res.value.regularMarketChangePercent || 0
      } else {
        data[symbols[index]] = 0
      }
    })

    // Calcula os Z-Scores para cada ativo usando o cache de volatilidade
    const zScores: Record<string, number> = {}
    await Promise.all(symbols.map(async (sym) => {
      zScores[sym] = await getAssetZScore(sym, data[sym])
    }))

    // ============================================
    // 1. GLOBAL RISK ENGINE (Modelo Estatístico)
    // ============================================
    
    // A. Equities (30%)
    const eqZ = zScores['^GSPC']

    // B. Volatility (25%) -> VIX Invertido
    const vixZ = -zScores['^VIX']
    const isVixInverted = data['^VIX'] > data['^VIX3M']
    const vixCurvePenalty = isVixInverted ? -1.5 : 0 // Penalidade severa se curva de vol inverter
    const volZ = (vixZ * 0.7) + (vixCurvePenalty * 0.3)

    // C. Credit Spreads (20%) -> HYG vs LQD
    const creditZ = zScores['HYG'] - zScores['LQD']

    // D. Rates & Dollar (15%)
    const dxyZ = -zScores['DX-Y.NYB']
    const tnxZ = zScores['^TNX']
    // Penaliza se juros 10Y subirem rápido demais (Z > 1.5)
    const ratesPenalty = tnxZ > 1.5 ? -Math.abs(tnxZ) : 0 
    const ratesZ = (dxyZ * 0.7) + (ratesPenalty * 0.3)

    // E. Crypto & Commodities (10%)
    const cryptoZ = zScores['BTC-USD']
    const copperZ = zScores['HG=F']
    const altZ = (cryptoZ * 0.5) + (copperZ * 0.5)

    // Composite Z-Score
    const globalCompositeZ = 
      (eqZ * 0.30) + 
      (volZ * 0.25) + 
      (creditZ * 0.20) + 
      (ratesZ * 0.15) + 
      (altZ * 0.10)

    // Transforma em escala -100 a +100
    const globalScore = normalizeScore(globalCompositeZ, 1.2)
    let globalStatus = 'Neutro'
    if (globalScore >= 30) globalStatus = 'Risk ON'
    if (globalScore <= -30) globalStatus = 'Risk OFF'

    // ============================================
    // 2. BRAZIL RISK ENGINE
    // ============================================
    const ibovZ = zScores['^BVSP']
    const ewzZ = zScores['EWZ']
    const usdBrlZ = -zScores['BRL=X']

    const brazilCompositeZ = (ibovZ * 0.4) + (ewzZ * 0.3) + (usdBrlZ * 0.3)
    const brazilScore = normalizeScore(brazilCompositeZ, 1.2)
    
    let brazilStatus = 'Neutro'
    if (brazilScore >= 30) brazilStatus = 'Risk ON'
    if (brazilScore <= -30) brazilStatus = 'Risk OFF'

    // ============================================
    // 3. WDO PRESSURE ENGINE
    // ============================================
    const wdoRaw = -(globalScore * 0.6 + brazilScore * 0.4)
    const wdoScore = Math.round(Math.min(Math.max(wdoRaw, -100), 100))
    
    let wdoAction = 'Neutro'
    if (wdoScore >= 70) wdoAction = 'Forte Compra'
    else if (wdoScore >= 30) wdoAction = 'Compra'
    else if (wdoScore <= -70) wdoAction = 'Forte Venda'
    else if (wdoScore <= -30) wdoAction = 'Venda'

    // Salvar histórico
    const now = new Date()
    now.setSeconds(0, 0)
    
    supabase.from('risk_history').insert({
      minute_timestamp: now.toISOString(),
      global_score: globalScore,
      brazil_score: brazilScore,
      wdo_score: wdoScore
    }).then(({ error }) => {
      if (error && error.code !== '23505') {
        console.error('Erro ao salvar histórico de risco:', error)
      }
    })

    return NextResponse.json({
      global: {
        score: globalScore,
        status: globalStatus,
        details: zScores // Retorna os z-scores para auditoria se necessário
      },
      brazil: {
        score: brazilScore,
        status: brazilStatus
      },
      wdo: {
        score: wdoScore,
        action: wdoAction
      },
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Erro no Risk Engine:', error)
    return NextResponse.json({ error: 'Falha ao calcular Risk Score' }, { status: 500 })
  }
}
