const Tradier = require('tradier-api')
const CustomError = require('../customError')

const tradier = new Tradier(process.env.TRADIER_ACCESS_TOKEN, process.env.TRADIER_ENDPOINT)

const getQuote = async (sym) => {
  try {
    const data = await tradier.getQuote(sym)

    if (!data) throw new Error('Invalid symbol')

    const quoteData = {
      symbol: data.symbol,
      companyName: data.description,
      last: data.last,
      volume: data.volume,
      change: data.change,
      changePercent: data.change_percentage,
      bid: data.bid,
      ask: data.ask,
      open: data.open,
      close: data.close,
      high: data.high,
      low: data.low,
      week52High: data.week_52_high,
      week52Low: data.week_52_low,
      bidSize: data.bidsize,
      askSize: data.asksize
    }

    const optionsData = {
      contractType: data.expiration_type,
      openInterest: data.open_interest
    }

    return {
      ...quoteData,
      ...optionsData
    }
  } catch (err) {
    const tradierError = new CustomError.ContextualError(
      'Tradier.SymbolNotFound',
      err.message,
      { sym: sym }
    )

    throw tradierError
  }
}

exports.getQuote = getQuote
/*

Trader Quote Response

{
  symbol: 'SPY210331C00300000',
  description: 'SPY Mar 31 2021 $300.00 Call',
  exch: 'Z',
  type: 'option',
  last: 80.72,
  change: -0.92,
  volume: 6,
  open: 81.12,
  high: 81.12,
  low: 80.72,
  close: 80.72,
  bid: 80.58,
  ask: 80.91,
  underlying: 'SPY',
  strike: 300,
  change_percentage: -1.13,
  average_volume: 0,
  last_volume: 1,
  trade_date: 1610469591250,
  prevclose: 81.64,
  week_52_high: 0,
  week_52_low: 0,
  bidsize: 50,
  bidexch: 'Q',
  bid_date: 1610486099000,
  asksize: 50,
  askexch: 'Q',
  ask_date: 1610486099000,
  open_interest: 326,
  contract_size: 100,
  expiration_date: '2021-03-31',
  expiration_type: 'quarterlys',
  option_type: 'call',
  root_symbol: 'SPY'
}

*/