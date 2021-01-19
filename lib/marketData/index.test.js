const marketData = require('./index')

describe('#parseStockSymbol', () => {
  describe('with valid symbol', () => {
    it('returns the result', () => {
      const result = marketData.parseStockSymbol('AAPL')

      expect(result).toBe('AAPL')
    })
  })

  describe('with an invalid symbol', () => {
    it('returns null', () => {
      const result = marketData.parseStockSymbol('43DX32')

      expect(result).toBeNull()
    })
  })
})

describe('#parseOptionsSymbol', () => {
  describe('with valid symbol', () => {
    it('returns the symbol components', () => {
      const symbol = 'AAPL210115C00123500'
      const result = marketData.parseOptionsSymbol(symbol)
      const expectedResult = {
        symbol: symbol,
        rootSymbol: 'AAPL',
        expiresAt: '2021-01-15',
        optionType: 'C',
        strike: '123.50'
      }

      expect(result).not.toBeNull()
      expect(result).toStrictEqual(expectedResult)
    })
  })

  describe('with an invalid symbol', () => {
    it('returns null', () => {
      const result = marketData.parseOptionsSymbol('AAPL210115P500030000')

      expect(result).toBeNull()
    })
  })
})

describe('#getQuote', () => {
  describe('with valid stock symbol', () => {
    it('returns the stock data', async () => {
      const result = await marketData.getQuote('AAPL')

      expect(result).not.toBeNull()
    })
  })

  describe('with valid options symbol', () => {
    it('returns the option chain data', async () => {
      const result = await marketData.getQuote('AAPL230317C00200000')

      expect(result).not.toBeNull()
    })
  })

  describe('options symbol with wrong expiry date', () => {
    it('throws an error', async () => {
      // Expiry date is wrong
      await expect(
        marketData.getQuote('AAPL000000C00200000')
      ).rejects.toThrow()
    })
  })

  describe('with unknown stock symbol', () => {
    it('throws an error', async () => {
      await expect(
        marketData.getQuote('ABPL')
      ).rejects.toThrow()
    })
  })
})
