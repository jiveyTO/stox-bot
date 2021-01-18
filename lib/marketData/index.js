const IEX = require('./iex')
const Tradier = require('./tradier')

const parseStockSymbol = (str) => {
  const regex = /^\$?([A-Z]{1,4}[\.\-]?([A-Z]{1,2})?[\.\-]?([A-Z]{1,2})?)/i
  const matches = String(str).match(regex)

  if (matches) return matches[1]

  return null
}

exports.parseStockSymbol = parseStockSymbol

const parseOptionsSymbol = (str) => {
  const regex = /^(\w+)(\d{2})(\d{2})(\d{2})([PC])(\d{8})$/i
  const matches = String(str).match(regex)

  if (matches) {
    return {
      symbol: matches[0],
      rootSymbol: matches[1],
      expiresAt: `20${matches[2]}-${matches[3]}-${matches[4]}`,
      optionType: matches[5],
      strike: (parseFloat(matches[6])/parseFloat(1000)).toFixed(2)
    }
  }

  return null
}

exports.parseOptionsSymbol = parseOptionsSymbol

const getQuote = async (sym) => {
  const optionParams = parseOptionsSymbol(sym)
  const stockSymbol = parseStockSymbol(sym)

  let iexData = {}
  let tradierData = {}

  if (stockSymbol || optionParams) {
    tradierData = await Tradier.getQuote(sym)

    if (!optionParams) {
      iexData = await IEX.getQuote(sym)
    }
  }

  return {
    ...tradierData,
    ...iexData
  }
}

exports.getQuote = getQuote