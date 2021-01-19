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
      expect(result.symbol).toBe('AAPL')
    })
  })

  describe('with valid options symbol', () => {
    it('returns the result', async () => {
      let result

      try {
        result = await Tradier.getQuote('AAPL230317C00200000')
      } catch (err) {
        console.error(err)
      }

      expect(result).toBeDefined()
      expect(result.symbol).toBe('AAPL230317C00200000')
    })
  })
})
