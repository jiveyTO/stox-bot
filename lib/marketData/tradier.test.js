const { TestScheduler } = require('jest')
const Tradier = require('./tradier')

describe('#getQuote', () => {
  describe('with valid stock symbol', () => {
    it('returns the result', async () => {
      let result

      try {
        result = await Tradier.getQuote('AAPL')
      } catch (err) {
        console.error(err)
      }

      expect(result).toBeDefined()
      expect(result[0].type).toBe('stock')
      expect(result[0].symbol).toBe('AAPL')
    })
  })

  describe('with valid options symbol', () => {
    it('returns the result', async () => {
      let result

      try {
        result = await Tradier.getQuote('AAPL230317C00200000', { greeks: true })
      } catch (err) {
        console.error(err)
      }

      expect(result).toBeDefined()
      expect(result[0].type).toBe('option')
      expect(result[0].symbol).toBe('AAPL230317C00200000')
      expect(result[0].greeks).toBeDefined()
    })
  })
})

describe('#getHistoricalQuote', () => {
  describe('with valid stock symbol', () => {
    test('returns the result', async () => {
      let result

      try {
        result = await Tradier.getHistoricalQuote('FB')
      } catch (err) {
        console.log(err)
      }

      expect(result).toBeDefined()
      expect(typeof result[0].close).toBe('number')
    })
  })
})
