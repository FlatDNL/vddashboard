import YahooFinance from 'yahoo-finance2'

async function test() {
  try {
    const yahooFinance = new YahooFinance()
    const quote = await yahooFinance.quote('^GSPC')
    console.log(quote.regularMarketPrice)
  } catch (err) {
    console.error('Error fetching:', err)
  }
}

test()
