const Discord = require('discord.js')
const MarketData = require('./marketData')
const dateFormat = require('dateformat')

const formatCurrency = (val) => {
  return `$${parseFloat(val).toFixed(2)}`
}

const getQuote = async (sym) => {
  let data

  try {
    data = await MarketData.getQuote(sym)
  } catch (err) {
    return err.message
  }

  if ( !Array.isArray(data) ) data = [data]

  return data
}

exports.getQuote = getQuote

const stockQuoteMessageEmbed = async (sym) => {
  let data

  try {
    data = await MarketData.getQuote(sym)
  } catch (err) {
    return err.message
  }

  const percentChange = parseFloat(data.changePercent).toFixed(2)
  const yahooUrl = `https://finance.yahoo.com/quote/${sym}?p=${sym}`

  const embed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`$${sym} - ${data.companyName}`)
    .setURL(yahooUrl)

  if (data.last) {
    const lastPriceTime = dateFormat(new Date(data.lastTimestamp), 'longTime')

    embed.setDescription(`As of ${lastPriceTime}.  Markets Open.`)
    embed.addFields(
      { name: 'Last Price', value: formatCurrency(data.last), inline: true }
    )
  } else {
    embed.setDescription('Markets are currently closed.')
    embed.addFields(
      { name: 'Last Price', value: formatCurrency(data.last), inline: true }
    )
  }

  embed.addFields(
    { name: '% Change', value: `${percentChange}%`, inline: true },
    { name: '$ Change', value: formatCurrency(data.change), inline: true },
    { name: 'Volume', value: data.volume, inline: true },
    { name: 'Low', value: formatCurrency(data.low), inline: true },
    { name: 'Open', value: formatCurrency(data.open), inline: true },
    { name: 'High', value: formatCurrency(data.high), inline: true },
    { name: '52w Low', value: formatCurrency(data.week52Low), inline: true },
    { name: '52w High', value: formatCurrency(data.week52High), inline: true }
  )

  return embed
}

exports.stockQuoteMessageEmbed = stockQuoteMessageEmbed

// expiration = 2022-12-31
const buildOptionsSymbol = (sym, expiration, contractType, strike) => {

  return [
    sym,
    dateFormat(expiration, "yy" ),
    dateFormat(expiration, "mm" ),
    dateFormat(expiration, "dd" ),
    contractType.toUpperCase()[0],
    String(parseInt(strike) * 1000).padStart(8, '0')
  ].join('')
}

exports.buildOptionsSymbol = buildOptionsSymbol

const optionsQuoteMessageEmbed = async (sym, expiration, strike) => {
  let data

  try {
    data = await MarketData.getQuote(sym)
  } catch (err) {
    console.error(err)
  }

  const percentChange = parseFloat(data.changePercent).toFixed(2)
  const yahooUrl = `https://finance.yahoo.com/quote/${sym}?p=${sym}`

  const embed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`$${sym} - ${data.companyName}`)
    .setURL(yahooUrl)

  if (data.open) {
    const lastPriceTime = dateFormat(new Date(data.lastTimestamp), 'longTime')

    embed.setDescription(`As of ${lastPriceTime}.  Markets Open.`)
    embed.addFields(
      { name: 'Current Price', value: formatCurrency(data.last), inline: true },
      { name: '% Change', value: `${percentChange}%`, inline: true },
      { name: '$ Change', value: formatCurrency(data.change), inline: true },
      { name: 'Low', value: formatCurrency(data.low), inline: true },
      { name: 'Open', value: formatCurrency(data.open), inline: true },
      { name: 'High', value: formatCurrency(data.high), inline: true },
      { name: 'Volume', value: data.volume, inline: true },
      { name: 'Open Interest', value: data.openInterest, inline: true }
    )
  } else {
    embed.setDescription('Markets are currently closed.')
    embed.addFields(
      { name: 'Last Price', value: formatCurrency(data.last), inline: true },
    )
  }

  embed.addFields(
    { name: 'Bid', value: formatCurrency(data.bid), inline: true },
    { name: 'Ask', value: formatCurrency(data.ask), inline: true },
    { name: 'Open Interest', value: data.openInterest, inline: true },
    { name: 'Delta', value: parseFloat(data.greeks.delta).toFixed(3), inline: true },
    { name: 'Theta', value: parseFloat(data.greeks.theta).toFixed(3), inline: true },
    { name: 'IV', value: parseFloat(data.greeks.mid_iv).toFixed(3), inline: true }
  )

  return embed
}

exports.optionsQuoteMessageEmbed = optionsQuoteMessageEmbed

const quoteMessageEmbed = async (sym) => {
  const optionParams = MarketData.parseOptionsSymbol(sym)

  if (optionParams) {
    return await optionsQuoteMessageEmbed(
      sym,
      optionParams.expiresAt,
      optionParams.strike
    )
  } else {
    return await stockQuoteMessageEmbed(sym)
  }
}

exports.quoteMessageEmbed = quoteMessageEmbed
