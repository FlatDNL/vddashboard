const YahooFinance = require('yahoo-finance2').default;
async function test() {
  try {
    const res = await YahooFinance.chart('BRL=X', { interval: '5m', range: '1d' });
    const quotes = res.quotes;
    for (let i = 0; i < quotes.length; i++) {
      const date = new Date(quotes[i].date);
      // UTC time: 08:50 BRT is 11:50 UTC (assuming UTC-3)
      if (date.getUTCHours() === 11 && date.getUTCMinutes() >= 45 && date.getUTCMinutes() <= 55) {
        console.log("FOUND 08:50:", date.toISOString(), quotes[i].close);
      }
    }
  } catch(e) { console.error(e) }
}
test();
