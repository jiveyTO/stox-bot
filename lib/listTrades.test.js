const listTrades = require('./listTrades')
const marketDataHelper = require('./marketDataHelper')
const { Trade } = require('../models')
const { trades, prices } = require('../test/testTradeData')

let commandG
let tradeListG

beforeAll(async () => {
  const interaction = {
    data: {
      name: 'list',
      options: [{ name: 'expiry', value: 'Feb 26' }]
    }
  }
  const client = {}

  Trade.findAll = jest.fn(() => trades)
  marketDataHelper.getQuote = jest.fn(() => prices)

  const { command, tradeList } = await listTrades.getList(interaction, Trade, client)
  commandG = command
  tradeListG = tradeList
})

describe('#listTrades', () => {
  describe('valid command', () => {
    test('command prints correctly', () => {
      expect(commandG).toBe('/list expiry:Feb 26')
    })
  })

  describe('valid returns', () => {
    test('BTO->STC fully closed all units with gain', () => {
      expect(tradeListG[0]).toBe('--- @johnSmith BTO 2x FB Feb 26 $280 C $1 [Closed]')
      expect(tradeListG[1]).toBe('+ @johnSmith STC 2x FB Feb 26 $280 C $3 [200%|$400]')
    })

    test('BTO->STC partially closed some units', () => {
      console.log(tradeListG)
      expect(tradeListG[2]).toBe('- @johnSmith BTO 2x TSLA Feb 26 $850 C $8 [-75%|-$600] [1 Closed]')
      expect(tradeListG[3]).toBe('- @johnSmith STC 1x TSLA Feb 26 $850 C $4 [-50%|-$400]')
    })
  })
})
