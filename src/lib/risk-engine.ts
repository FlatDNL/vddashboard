import yahooFinance from 'yahoo-finance2'

// Cache em memória para não consultar 90 dias de histórico toda vez
const statsCache: Record<string, { mean: number; std: number; timestamp: number }> = {}
const CACHE_DURATION = 1000 * 60 * 60 * 12 // 12 horas

async function fetchHistoricalStats(symbol: string) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 90) // ~64 dias úteis

  try {
    const result = await yahooFinance.historical(symbol, { period1: start, period2: end })
    if (result.length < 2) return { mean: 0, std: 1 }

    const returns: number[] = []
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1].close
      const curr = result[i].close
      if (prev > 0) {
        returns.push(((curr - prev) / prev) * 100) // Em porcentagem
      }
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
    const std = Math.sqrt(variance)

    // Evitar divisão por zero (fallback para 1%)
    return { mean, std: std > 0 ? std : 1 }
  } catch (error) {
    console.error(`Erro ao buscar histórico de ${symbol}:`, error)
    return { mean: 0, std: 1 } // Fallback seguro
  }
}

export async function getAssetZScore(symbol: string, currentChangePercent: number) {
  const now = Date.now()
  if (!statsCache[symbol] || now - statsCache[symbol].timestamp > CACHE_DURATION) {
    const stats = await fetchHistoricalStats(symbol)
    statsCache[symbol] = { ...stats, timestamp: now }
  }

  const { mean, std } = statsCache[symbol]
  // Z-Score = (Valor Atual - Média) / Desvio Padrão
  return (currentChangePercent - mean) / std
}

// Transformação estatística: Função Tanh mapeia infinito para [-1, 1]
// Multiplicamos por 100 para a escala [-100, 100]. O divisor (ex: 1.5) controla a sensibilidade.
export function normalizeScore(zScoreComposite: number, sensitivity = 1.5) {
  return Math.round(Math.tanh(zScoreComposite / sensitivity) * 100)
}
