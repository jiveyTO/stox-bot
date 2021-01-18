const IEX = require('./iex')

describe('#getQuote', () => {
  describe('with valid symbol', () => {
    it('returns the result', async () => {
      let result

      try {
        result = await IEX.getQuote('AAPL')
      } catch (err) {
        console.error(err)
      }

      expect(result).toBeDefined()
      expect(result.symbol).toBe('AAPL')
    })
  })
})
