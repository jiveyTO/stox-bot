const axios = require('axios')
const querystring = require('querystring')
const ensureArray = require('ensure-array')
const CustomError = require('../customError')

const URLS = {
  prod: 'https://api.tradier.com/v1/',
  beta: 'https://api.tradier.com/beta/',
  sandbox: 'https://sandbox.tradier.com/v1/',
  stream: 'https://stream.tradier.com/v1'
}

const parseQuery = (url, params) => {
  const query =
    params &&
    querystring.stringify(
      Object.keys(params).reduce((values, key) => {
        if (params[key] !== undefined) {
          values[key] = params[key]
        }
        return values
      }, {})
    )
  return query ? `${url}?${query}` : url
}

const parseData = (data) => {
  return typeof data === 'object'
    ? querystring.stringify(data)
    : querystring.parse(data)
}
class Tradier {
  constructor (accessToken, endpoint = 'prod') {
    this.accessToken = accessToken
    this.endpoint = endpoint
  }

  // region HTTP
  config () {
    return {
      baseURL: URLS[this.endpoint],
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json'
      }
    }
  }

  get (url, params, config = {}) {
    return axios.request({
      method: 'get',
      url: parseQuery(url, params),
      ...this.config(),
      ...config
    })
  }

  post (url, data, config = {}) {
    return axios.request({
      method: 'post',
      url,
      data: parseData(data),
      ...this.config(),
      ...config
    })
  }

  put (url, data, config = {}) {
    return axios.request({
      method: 'put',
      url,
      data: parseData(data),
      ...this.config(),
      ...config
    })
  }

  delete (url, config = {}) {
    return axios.request({
      method: 'delete',
      url,
      ...this.config(),
      ...config
    })
  }

  getQuote (symbols, options = {}) {
    const params = {
      symbols: ensureArray(symbols).join(','),
      ...options
    }

    return this.get('markets/quotes', params).then(
      ({
        data: {
          quotes: { quote }
        }
      }) => quote
    )
  }
}

const tradier = new Tradier(process.env.TRADIER_ACCESS_TOKEN, process.env.TRADIER_ENDPOINT)

const getQuote = async (sym) => {
  try {
    const data = await tradier.getQuote(sym, { greeks: true })

    if (!data) throw new Error('Invalid symbol')

    const quoteData = {
      type: data.type,
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

    if (data.type === 'option') {
      const optionsData = {
        contractType: data.expiration_type,
        openInterest: data.open_interest,
        greeks: data.greeks
      }

      return {
        ...quoteData,
        ...optionsData
      }
    }

    return quoteData
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
  symbol: 'AAPL',
  description: 'Apple Inc',
  exch: 'Q',
  type: 'stock',
  last: 132.03,
  change: 4.2,
  volume: 104319489,
  open: 128.66,
  high: 132.49,
  low: 128.55,
  close: 132.03,
  bid: 132.92,
  ask: 133,
  change_percentage: 3.29,
  average_volume: 108329374,
  last_volume: 8657252,
  trade_date: 1611176400583,
  prevclose: 127.83,
  week_52_high: 138.789,
  week_52_low: 53.1525,
  bidsize: 20,
  bidexch: 'P',
  bid_date: 1611190794000,
  asksize: 87,
  askexch: 'Q',
  ask_date: 1611190794000,
  root_symbols: 'AAPL'
}

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
