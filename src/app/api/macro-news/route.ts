import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()
export const revalidate = 60

export async function GET() {
  try {
    // 1. Busca notícias financeiras do Dólar no Yahoo Finance
    const newsSearch = await yahooFinance.search('BRL=X', { newsCount: 8 })
    const rawArticles = newsSearch.news || []

    const articles = rawArticles.map((n: any, idx: number) => ({
      id: n.uuid || `news-${idx}`,
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      providerPublishTime: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : new Date().toISOString()
    }))

    return NextResponse.json({
      timestamp: Date.now(),
      articles
    })
  } catch (error) {
    console.error('Macro News API Error:', error)
    return NextResponse.json({ articles: [] })
  }
}
