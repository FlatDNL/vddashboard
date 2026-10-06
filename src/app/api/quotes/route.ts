import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new (YahooFinance as any)()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols')
  if (!symbolsParam) {
    return NextResponse.json({ error: 'Nenhum símbolo fornecido' }, { status: 400 })
  }

  const symbols = symbolsParam.split(',')

  try {
    const quotes = (await yahooFinance.quote(symbols)) as any[]
    const result: Record<string, any> = {}
    
    quotes.forEach((q: any) => {
      result[q.symbol] = {
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        prev: q.regularMarketPreviousClose,
      }
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao buscar quotes:', error)
    return NextResponse.json({ error: 'Falha ao buscar quotes' }, { status: 500 })
  }
}
