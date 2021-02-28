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
  },
  {
    id: 6,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'TSLA',
    type: 'Put',
    action: 'STO',
    expiry: new Date(2021, 0, 29),
    strike: 800,
    price: 10.00,
    quantity: 9,
    createdAt: new Date(2021, 0, 22),
    updatedAt: new Date(2021, 0, 22)
  },
  {
    id: 7,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'TSLA',
    type: 'Put',
    action: 'STO',
    expiry: new Date(2021, 0, 29),
    strike: 800,
    price: 9.00,
    quantity: 10,
    createdAt: new Date(2021, 0, 22),
    updatedAt: new Date(2021, 0, 22)
  },
  {
    id: 8,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'TSLA',
    type: 'Put',
    action: 'STO',
    expiry: new Date(2021, 0, 29),
    strike: 800,
    price: 14.15,
    quantity: 4,
    createdAt: new Date(2021, 0, 22),
    updatedAt: new Date(2021, 0, 22)
  },
  {
    id: 9,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'TSLA',
    type: 'Put',
    action: 'BTC',
    expiry: new Date(2021, 0, 29),
    strike: 800,
    price: 6.50,
    quantity: 14,
    createdAt: new Date(2021, 0, 22),
    updatedAt: new Date(2021, 0, 22)
  },
  {
    id: 10,
    guild: '1234567890',
    trader: 'johnSmith',
    ticker: 'TSLA',
    type: 'Put',
    action: 'BTC',
    expiry: new Date(2021, 0, 29),
    strike: 800,
    price: 6.50,
    quantity: 4,
    createdAt: new Date(2021, 0, 22),
    updatedAt: new Date(2021, 0, 22)
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
  'TSLA|2021-01-29': {
    date: '2021-02-26',
    close: 793.53
  },
  'TSLA|2021-02-26': {
    date: '2021-02-26',
    close: 675.5
  },
  'FB|2021-02-26': {
    date: '2021-02-26',
    close: 257.62
  }
}

exports.historical = historicalPrices
