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

    // Tradutor completo para Português do Brasil (PT-BR)
    const translateTitle = (title: string) => {
      let t = title

      // Termos e Indicadores consagrados do mercado
      if (t.includes('BCB Focus Market Readout')) return 'Boletim Focus (BCB)'
      if (t.includes('Nonfarm Payrolls') || t.includes('Nonfarm')) return 'Payroll (Emprego Não-Agrícola EUA)'
      if (t.includes('Fed Interest Rate Decision')) return 'Decisão de Juros do Fed (EUA)'
      if (t.includes('Interest Rate Decision') && t.includes('BR')) return 'Decisão de Juros Copom (Brasil)'
      if (t.includes('Initial Jobless Claims')) return 'Pedidos de Auxílio-Desemprego'
      if (t.includes('Continuing Jobless Claims')) return 'Pedidos Contínuos de Auxílio-Desemprego'
      if (t.includes('Consumer Price Index') || t.includes('CPI')) {
        return t.includes('BR') ? 'IPCA - Inflação ao Consumidor' : 'CPI - Inflação ao Consumidor EUA'
      }
      if (t.includes('Producer Price Index') || t.includes('PPI')) return 'PPI - Inflação ao Produtor'
      if (t.includes('PCE Price Index') || t.includes('PCE')) return 'PCE - Inflação Consumo Pessoal'
      if (t.includes('Unemployment Rate')) return 'Taxa de Desemprego'
      if (t.includes('GDP Growth Rate') || t.includes('GDP')) return 'PIB - Produto Interno Bruto'
      if (t.includes('Retail Sales')) return 'Vendas no Varejo'
      if (t.includes('Industrial Production')) return 'Produção Industrial'
      if (t.includes('Trade Balance')) return 'Balança Comercial'
      if (t.includes('Current Account')) return 'Transações Correntes'
      if (t.includes('Foreign Direct Investment')) return 'Investimento Direto no País'
      if (t.includes('Manufacturing PMI')) return 'PMI Industrial'
      if (t.includes('Services PMI')) return 'PMI de Serviços'
      if (t.includes('S&P Global PMI')) return 'PMI S&P Global'
      if (t.includes('ISM Manufacturing')) return 'PMI Industrial ISM'
      if (t.includes('ISM Non-Manufacturing') || t.includes('ISM Services')) return 'PMI de Serviços ISM'
      if (t.includes('Michigan Consumer Sentiment')) return 'Confiança do Consumidor Michigan'
      if (t.includes('Consumer Confidence')) return 'Confiança do Consumidor'
      if (t.includes('Building Permits')) return 'Alvarás de Construção'
      if (t.includes('Housing Starts')) return 'Início de Construção de Casas'
      if (t.includes('New Home Sales')) return 'Vendas de Casas Novas'
      if (t.includes('Existing Home Sales')) return 'Vendas de Casas Usadas'
      if (t.includes('Durable Goods Orders')) return 'Pedidos de Bens Duráveis'
      if (t.includes('Factory Orders')) return 'Encomendas à Indústria'
      if (t.includes('Fed Williams Speech') || t.includes('Fed Chair Powell Speech') || t.includes('Speech')) {
        return t.replace('Speech', 'Discurso').replace('Fed Chair', 'Presidente do Fed')
      }
      if (t.includes('FOMC Minutes')) return 'Ata da Reunião do FOMC'
      if (t.includes('Copom Minutes')) return 'Ata do Copom'
      if (t.includes('3-Month Bill Auction')) return 'Leilão de Títulos (3 Meses)'
      if (t.includes('6-Month Bill Auction')) return 'Leilão de Títulos (6 Meses)'
      if (t.includes('10-Year Note Auction')) return 'Leilão de Títulos (10 Anos)'
      if (t.includes('30-Year Bond Auction')) return 'Leilão de Títulos (30 Anos)'
      if (t.includes('UN General Assembly')) return 'Assembleia Geral da ONU'

      // Substituição sistemática de termos em inglês
      return t
        .replace(/MoM/g, 'm/m')
        .replace(/YoY/g, 'a/a')
        .replace(/QoQ/g, 't/t')
        .replace(/Rate/g, 'Taxa')
        .replace(/Index/g, 'Índice')
        .replace(/Inflation/g, 'Inflação')
        .replace(/Balance/g, 'Balanço')
        .replace(/Price/g, 'Preço')
        .replace(/Sales/g, 'Vendas')
        .replace(/Orders/g, 'Pedidos')
        .replace(/Mid-month/g, 'Prévia')
        .replace(/Final/g, 'Final')
        .replace(/Flash/g, 'Preliminar')
    }

    // Função quantitativa para calcular a Pressão Direcional no WDO (USD/BRL)
    const calculatePressure = (e: any): { direction: 'ALTA' | 'BAIXA' | 'NEUTRO' | 'AGUARDANDO'; explanation: string } => {
      if (e.actual === null || e.actual === undefined || e.forecast === null || e.forecast === undefined) {
        return { direction: 'AGUARDANDO', explanation: 'Aguardando publicação do dado' }
      }

      const actual = Number(e.actual)
      const forecast = Number(e.forecast)
      const diff = actual - forecast

      if (Math.abs(diff) < 0.0001) {
        return { direction: 'NEUTRO', explanation: 'Resultado exatamente em linha com a projeção' }
      }

      const titleLower = (e.title || '').toLowerCase()
      const isUnemploymentOrClaims = titleLower.includes('unemployment') || titleLower.includes('claims') || titleLower.includes('desemprego')

      if (e.country === 'US') {
        // Dados dos EUA:
        // Economia/Inflação EUA acima do esperado -> Dólar fortalece globalmente -> USD/BRL sobe (ALTA / COMPRA)
        // Desemprego EUA acima do esperado -> Economia fraca -> Dólar cai (BAIXA / VENDA)
        if (isUnemploymentOrClaims) {
          return diff > 0 
            ? { direction: 'BAIXA', explanation: 'Desemprego maior nos EUA enfraquece o Dólar (Pressão de Venda)' }
            : { direction: 'ALTA', explanation: 'Desemprego menor nos EUA fortalece o Dólar (Pressão de Compra)' }
        } else {
          return diff > 0 
            ? { direction: 'ALTA', explanation: 'Dado dos EUA acima do esperado fortalece o Dólar (Pressão de Compra)' }
            : { direction: 'BAIXA', explanation: 'Dado dos EUA abaixo do esperado enfraquece o Dólar (Pressão de Venda)' }
        }
      } else {
        // Dados do BRASIL:
        // Inflação/Juros BR acima do esperado -> Selic sobe -> Real ganha força -> USD/BRL cai (BAIXA / VENDA)
        // Desemprego/Déficit BR acima do esperado -> Real enfraquece -> USD/BRL sobe (ALTA / COMPRA)
        if (isUnemploymentOrClaims || titleLower.includes('deficit') || titleLower.includes('divida')) {
          return diff > 0 
            ? { direction: 'ALTA', explanation: 'Desemprego/Déficit maior no Brasil enfraquece o Real (Pressão de Alta no Dólar)' }
            : { direction: 'BAIXA', explanation: 'Desemprego/Déficit menor no Brasil fortalece o Real (Pressão de Baixa no Dólar)' }
        } else {
          return diff > 0 
            ? { direction: 'BAIXA', explanation: 'Dado de crescimento/inflação maior no Brasil fortalece o Real (Pressão de Baixa no Dólar)' }
            : { direction: 'ALTA', explanation: 'Dado econômico menor no Brasil enfraquece o Real (Pressão de Alta no Dólar)' }
        }
      }
    }

    const formattedEvents = events.map((e: any) => {
      const eventDate = new Date(e.date)
      const timeStr = eventDate.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit'
      })

      let impact: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
      if (e.importance === 1) impact = 'HIGH'
      else if (e.importance === 0) impact = 'MEDIUM'

      const formatVal = (val: any, unit?: string) => {
        if (val === null || val === undefined) return '-'
        return `${val}${unit || ''}`
      }

      const isCompleted = e.actual !== null && e.actual !== undefined
      const pressure = calculatePressure(e)

      return {
        id: e.id,
        time: timeStr,
        dateIso: e.date,
        country: e.country,
        currency: e.currency || (e.country === 'US' ? 'USD' : 'BRL'),
        title: translateTitle(e.title),
        originalTitle: e.title,
        impact,
        actual: formatVal(e.actual, e.unit),
        forecast: formatVal(e.forecast, e.unit),
        previous: formatVal(e.previous, e.unit),
        isCompleted,
        pressure
      }
    })

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
