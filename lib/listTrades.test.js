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

    test('STO->EXP fully expired all units and kept all premiums', () => {
      expect(tradeListG[4]).toBe('+ @johnSmith STO 4x TSLA Feb 26 $400 P $1 [100%|$400] [4 Exp]')
    })

    test('STO->BTC big btc (14) to close out two sto, one fully (9) and one partial (5)', () => {
      expect(tradeListG[5]).toBe('--- @johnSmith STO 9x TSLA Jan 29 $800 P $10 [Closed] [Exp]')
      expect(tradeListG[6]).toBe('+ @johnSmith STO 10x TSLA Jan 29 $800 P $9 [28%|$253] [9 Closed] [1 Exp]')
      expect(tradeListG[7]).toBe('+ @johnSmith STO 4x TSLA Jan 29 $800 P $14.15 [54%|$3072] [4 Exp]')
      expect(tradeListG[8]).toBe('+ @johnSmith BTC 14x TSLA Jan 29 $800 P $6.5 [33%|$4400] [Exp]')
      expect(tradeListG[9]).toBe('+ @johnSmith BTC 4x TSLA Jan 29 $800 P $6.5 [28%|$1000] [Exp]')
    })
  })
})
