import { NextResponse } from 'next/server'

export const revalidate = 60 // Revalida a cada 1 minuto

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let dateStr = searchParams.get('date')

    const now = new Date()
    let targetDate = dateStr ? new Date(dateStr) : now

    // Função para buscar eventos em uma data específica
    async function fetchEventsForDate(d: Date) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateFormatted = `${year}-${month}-${day}`

      const from = `${dateFormatted}T00:00:00.000Z`
      const to = `${dateFormatted}T23:59:59.000Z`

      const url = `https://economic-calendar.tradingview.com/events?from=${from}&to=${to}&countries=US,BR`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Origin': 'https://www.tradingview.com',
          'Referer': 'https://www.tradingview.com/'
        },
        next: { revalidate: 60 }
      })

      if (!res.ok) return []
      const json = await res.json()
      return json.result || []
    }

    let events = await fetchEventsForDate(targetDate)

    // Se a data de hoje for final de semana ou sem eventos, busca o próximo dia útil com eventos
    let isWeekendOrEmpty = false
    if (events.length === 0) {
      isWeekendOrEmpty = true
      let nextDay = new Date(targetDate)
      for (let i = 1; i <= 5; i++) {
        nextDay.setDate(nextDay.getDate() + 1)
        events = await fetchEventsForDate(nextDay)
        if (events.length > 0) {
          targetDate = nextDay
          break
        }
      }
    }

    // Tradução e formatação de títulos comuns
    const translateTitle = (title: string) => {
      if (title.includes('BCB Focus Market Readout')) return 'Boletim Focus (BCB)'
      if (title.includes('Nonfarm Payrolls') || title.includes('Nonfarm')) return 'Payroll (Emprego EUA)'
      if (title.includes('Fed Interest Rate Decision')) return 'Decisão de Juros Fed (EUA)'
      if (title.includes('Interest Rate Decision') && title.includes('BR')) return 'Decisão de Juros Copom (Brasil)'
      if (title.includes('Inflation Rate') || title.includes('CPI')) return title.includes('BR') ? 'IPCA (Inflação Brasil)' : 'CPI (Inflação EUA)'
      if (title.includes('Unemployment Rate')) return 'Taxa de Desemprego'
      if (title.includes('GDP Growth Rate') || title.includes('GDP')) return 'PIB (Produto Interno Bruto)'
      if (title.includes('Speech')) return title.replace('Speech', 'Discurso')
      return title
    }

    const formattedEvents = events.map((e: any) => {
      const eventDate = new Date(e.date)
      const timeStr = eventDate.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit'
      })

      // Importance: 1 (Alta 🔴), 0 (Média 🟡), -1 (Baixa ⚪)
      let impact: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
      if (e.importance === 1) impact = 'HIGH'
      else if (e.importance === 0) impact = 'MEDIUM'

      const formatVal = (val: any, unit?: string) => {
        if (val === null || val === undefined) return '-'
        return `${val}${unit || ''}`
      }

      const isCompleted = e.actual !== null && e.actual !== undefined

      return {
        id: e.id,
        time: timeStr,
        dateIso: e.date,
        country: e.country, // 'US' ou 'BR'
        currency: e.currency || (e.country === 'US' ? 'USD' : 'BRL'),
        title: translateTitle(e.title),
        originalTitle: e.title,
        impact,
        actual: formatVal(e.actual, e.unit),
        forecast: formatVal(e.forecast, e.unit),
        previous: formatVal(e.previous, e.unit),
        isCompleted
      }
    })

    // Ordenar por horário
    formattedEvents.sort((a: any, b: any) => a.dateIso.localeCompare(b.dateIso))

    return NextResponse.json({
      targetDate: targetDate.toISOString().split('T')[0],
      isUpcomingBusinessDay: isWeekendOrEmpty,
      events: formattedEvents
    })

  } catch (error) {
    console.error('Calendar API Error:', error)
    return NextResponse.json({ error: 'Falha ao buscar calendário econômico' }, { status: 500 })
  }
}
