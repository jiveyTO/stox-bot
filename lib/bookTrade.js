const inputParse = require('./inputParse')

// Returns a object representing a formatted trade
function formatTrade (trade) {
  let t = null

  // Apply general field rules
  if (trade[0].value) {
    t = trade.map(item => item.value)
  } else {
    console.log('Invalid trade array')
    return
  }

  // Format ticker
  const ticker = t[0].toUpperCase()
  // Format type
  const type = t[1].charAt(0).toUpperCase() + t[1].slice(1).toLowerCase()

  // Format action
  const action = t[2].toUpperCase()

  // Format the year in case they didn't enter it
  const expiry = inputParse.dateParse(t[3])

  // Format the currency
  const strike = (t[4].charAt(0) === '$') ? t[4].slice(1) : t[4]
  const price = (t[5].charAt(0) === '$') ? t[5].slice(1) : t[5]

  return {
    ticker: ticker,
    type: type,
    action: action,
    expiry: expiry.dateDB,
    expiryDisplay: expiry.dateDisplay,
    strike: strike,
    price: price,
    quantity: t[6]
  }
}

const bookTrade = async (interaction, tradesTable, client) => {
  const tradeInput = interaction.data.options
  const userID = interaction.member.user.id
  const trade = formatTrade(tradeInput)

  const tradeStr = `<@${userID}>: ${trade.action} ${trade.quantity} x ${trade.ticker}` +
                     ` ${trade.expiryDisplay} $${trade.strike} ${trade.type} at $${trade.price}`

  try {
    // equivalent to: INSERT INTO trades (trader, ticker, type, action, expiry, strike, price, quantity ) values (?, ?, ?, ?, ?, ?, ?, ?);
    await tradesTable.create({
      guild: interaction.guild_id,
      trader: interaction.member.user.username,
      ticker: trade.ticker,
      type: trade.type,
      action: trade.action,
      expiry: trade.expiry,
      strike: trade.strike,
      price: trade.price,
      quantity: trade.quantity
    })

    // Show the logged trade
    // Type 3 will eat the original message aka ephemeral
    client.api.interactions(interaction.id, interaction.token).callback.post({
      data: {
        type: 4,
        data: {
          content: `⭐️ ${tradeStr}`
        }
      }
    })
  } catch (e) {
    let errStr = `Something went wrong with adding a trade for ${tradeStr}`

    if (e.name === 'SeqelizeUniqueConstraintError') {
      errStr = 'That trade already exists'
    }

    console.log('DB error = ' + e)

    client.api.interactions(interaction.id, interaction.token).callback.post({
      data: {
        type: 3,
        data: {
          content: errStr
        }
      }
    })
  }
}

exports.submit = bookTrade
