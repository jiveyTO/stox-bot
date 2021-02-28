const tradesArray = [
  {
    id: 1,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'FB',
    type: 'Call',
    action: 'BTO',
    expiry: new Date(2021, 1, 26),
    strike: 280,
    price: 1.00,
    quantity: 2,
    createdAt: new Date(2021, 1, 1),
    updatedAt: new Date(2021, 1, 1)
  },
  {
    id: 2,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'FB',
    type: 'Call',
    action: 'STC',
    expiry: new Date(2021, 1, 26),
    strike: 280,
    price: 3.00,
    quantity: 2,
    createdAt: new Date(2021, 1, 19),
    updatedAt: new Date(2021, 1, 19)
  },
  {
    id: 3,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'TSLA',
    type: 'Call',
    action: 'BTO',
    expiry: new Date(2021, 1, 26),
    strike: 850,
    price: 8.00,
    quantity: 2,
    createdAt: new Date(2021, 1, 1),
    updatedAt: new Date(2021, 1, 1)
  },
  {
    id: 4,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'TSLA',
    type: 'Call',
    action: 'STC',
    expiry: new Date(2021, 1, 26),
    strike: 850,
    price: 4.00,
    quantity: 1,
    createdAt: new Date(2021, 1, 19),
    updatedAt: new Date(2021, 1, 19)
  },
  {
    id: 5,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'TSLA',
    type: 'Put',
    action: 'STO',
    expiry: new Date(2021, 1, 26),
    strike: 400,
    price: 1.00,
    quantity: 4,
    createdAt: new Date(2021, 1, 22),
    updatedAt: new Date(2021, 1, 22)
  }
]

const tradesArrayReturn = tradesArray.map(trade => {
  return {
    dataValues: trade,
    ...trade
  }
})

exports.trades = tradesArrayReturn

const pricesArray = [
  {
    symbol: 'FB210226C00280000',
    last: 0.36
  },
  {
    symbol: 'TSLA210226C00850000',
    last: 2.00,
    close: 2.00
  }
]

exports.prices = pricesArray

const historicalPrices = {
  'TSLA|2021-02-26': {
    date: '2021-02-26',
    open: 700,
    high: 706.7,
    low: 659.51,
    close: 675.5,
    volume: 41089173
  },
  'FB|2021-02-26': {
    date: '2021-02-26',
    open: 256.47,
    high: 265.55,
    low: 256.47,
    close: 257.62,
    volume: 26619517
  }
}

exports.historical = historicalPrices
