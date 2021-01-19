const IEX = require('iexcloud_api_wrapper')
const CustomError = require('../customError')

const getQuote = async (sym) => {
  try {
    const data = await IEX.quote(sym)

    if (!data) throw new Error('Invalid symbol')

    return {
      symbol: data.symbol,
      realTimePrice: data.iexRealtimePrice,
      realTimeTimestamp: data.iexLastUpdated,
      extendedPrice: data.extendedPrice,
      extendedChange: data.extendedChange,
      extendedChangePercent: data.extendedChangePercent,
      extendedTimestamp: data.extendedPriceTime
    }
  } catch (err) {
    const iexError = new CustomError.ContextualError(
      'IEX.SymbolNotFound',
      err.message,
      { sym: sym }
    )

    throw iexError
  }
}

exports.getQuote = getQuote

/*

IEX Quote Response

Quote {
  symbol: 'AAPL',
  companyName: 'Apple Inc',
  calculationPrice: 'close',
  open: 132,
  openTime: 1690885206175,
  close: 133.01,
  closeTime: 1643385719673,
  high: 134.59,
  low: 132.5,
  latestPrice: 135.2,
  latestSource: 'Close',
  latestTime: 'January 11, 2021',
  latestUpdate: 1647448603133,
  latestVolume: 101057573,
  iexRealtimePrice: 133.83,
  iexRealtimeSize: 200,
  iexLastUpdated: 1625562880765,
  delayedPrice: 131.71,
  delayedPriceTime: 1662107128503,
  extendedPrice: 132.44,
  extendedChange: 0.2,
  extendedChangePercent: 0.00151,
  extendedPriceTime: 1625035202211,
  previousClose: 135.2,
  change: -3.18,
  changePercent: -0.02423,
  iexMarketPercent: 0.012085528037077572,
  iexVolume: 1217294,
  avgTotalVolume: 121403614,
  iexBidPrice: 0,
  iexBidSize: 0,
  iexAskPrice: 0,
  iexAskSize: 0,
  marketCap: 2173454510776,
  week52High: 142.88,
  week52Low: 57.43,
  ytdChange: -0.0288338336507744,
  primaryExchange: 'AQMEGLALKAN GDB (EELNCTSA /SSRO)T',
  openSource: 'aolcifif',
  closeSource: 'fflciaio',
  highTime: 1625157740483,
  highSource: 'pi dnu dieeema1rye5t lc',
  lowTime: 1674516908262,
  lowSource: 'c 1d5iiemdaurnteyle  pe',
  oddLotDelayedPrice: 129.68,
  oddLotDelayedPriceTime: 1689520715030,
  previousVolume: 106410440,
  volume: 104349566,
  iexOpen: 129.18,
  iexOpenTime: 1678970755115,
  iexClose: 135.28,
  iexCloseTime: 1639990758067,
  peRatio: 39.76,
  lastTradeTime: 1621939414133,
  isUSMarketOpen: false
}

*/
