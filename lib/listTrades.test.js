const listTrades = require('./listTrades')
const marketDataHelper = require('./marketDataHelper')
const { Trade } = require('../models')
const { trades, prices, historical } = require('../test/testTradeData')

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
  marketDataHelper.getHistoricalQuote = jest.fn((arg1, arg2) => {
    return [historical[arg1 + '|' + arg2.start]]
  })

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
      expect(tradeListG[0]).toBe('--- @johnSmith BTO 2x FB Feb 26 $280 C $1 [Closed] [Exp]')
      expect(tradeListG[1]).toBe('+ @johnSmith STC 2x FB Feb 26 $280 C $3 [200%|$400] [Exp]')
    })

    test('BTO->STC partially closed some units', () => {
      expect(tradeListG[2]).toBe('- @johnSmith BTO 2x TSLA Feb 26 $850 C $8 [-100%|-$800] [1 Closed] [1 Exp]')
      expect(tradeListG[3]).toBe('- @johnSmith STC 1x TSLA Feb 26 $850 C $4 [-50%|-$400] [Exp]')
    })

    test('STO->EXP expired and kept all premiums', () => {
      expect(tradeListG[4]).toBe('+ @johnSmith STO 4x TSLA Feb 26 $400 P $1 [100%|$400] [4 Exp]')
    })
  })
})
