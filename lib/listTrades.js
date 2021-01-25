const dateFormat = require('dateformat')
const marketDataHelper = require('./marketDataHelper')

const listTrades = async (tradesTable, options) => {
  // equivalent to: SELECT * FROM trades WHERE trader=<userFilter>;
  let filter = options.commandArgs[0]
  let orderBy = { order: [['trader', 'ASC'], ['expiry', 'ASC'], ['ticker', 'ASC'], ['id', 'ASC']] }
  if (filter === 'ticker') orderBy = { order: [['ticker', 'ASC'], ['expiry', 'ASC'], ['trader', 'ASC']] }
  let whereClause = {}

  if (filter !== 'ticker' && filter) {
    // if they enter their @username
    if (filter.substring(0, 3) === '<@!') {
      const user = await options.client.users.fetch(filter.substring(3, filter.length - 1))
      filter = user.username
    }
    whereClause = { where: { trader: filter } }
  }

  const tradesList = await tradesTable.findAll({ ...whereClause, ...orderBy })

  // do some formatting on the trades
  const tradeListArr = tradesList.map(trade => {
    const t = trade.expiry
    const utcStr = `${t.getUTCFullYear()}-${t.getUTCMonth() + 1}-${t.getUTCDate()}`
    const estStr = `${utcStr} 16:00:00 EST`

    // reformat expiryDate
    const expiryDateStr = dateFormat(utcStr + ' 00:00:00', 'mediumDate')
    const tradeStr = `@${trade.trader}: ${trade.action} ${trade.quantity} x ${trade.ticker} ${expiryDateStr} $${trade.strike} ${trade.type} at $${trade.price}`

    // add the trade to the list
    return {
      tradeStr: tradeStr,
      symbol: marketDataHelper.buildOptionsSymbol(trade.ticker, utcStr, trade.type, trade.strike),
      expired: Date.now() > Date.parse(estStr),
      ...trade.dataValues
    }
  })

  // calculate the returns
  // assumption is that trades are sorted by execution date
  const tradeReturns = {}

  // first just tally everything up
  tradeListArr.map(thisTrade => {
    const index = thisTrade.trader + '|' + thisTrade.symbol
    const saved = (tradeReturns[index]) ? tradeReturns[index] : {}

    if (thisTrade.symbol === 'TSLA210129P00685000') {
      console.log('print trade for TSLA210129P00685000')
      console.log(thisTrade)
    }

    const r = {
      openQty: saved.openQty || 0,
      openTotalAmt: saved.openTotalAmt || 0,
      closeQty: saved.closeQty || 0,
      closeTotalAmt: saved.closeTotalAmt || 0,
      openTrades: saved.openTrades || []
    }

    if (thisTrade.action === 'BTO' || thisTrade.action === 'STO') {
      r.openQty += thisTrade.quantity
      r.openTotalAmt += thisTrade.price * thisTrade.quantity * 100

      // keep track of open trades for this symbol's return
      // close them as position is closed
      r.openTrades.push({
        ref: thisTrade
      })
    } else if (thisTrade.action === 'BTC' || thisTrade.action === 'STC') {
      // update the return
      r.closeQty += thisTrade.quantity
      r.closeTotalAmt += thisTrade.price * thisTrade.quantity * 100

      // update the trades
      let closedCount = 0
      while (closedCount < thisTrade.quantity) {
        // pick 0 (the first) to match closed positions as FIFO
        let tradeRef
        try {
          tradeRef = r.openTrades[0].ref
        } catch (err) {
          console.log('tradeRef = r.openTrades[0].ref is undefined')
          console.log('r')
          console.log(r)
          console.log('tradeReturns[index]')
          console.log(tradeReturns[index])
          console.log('thisTrade')
          console.log(thisTrade)
          return null
        }
        tradeRef.closedQty = tradeRef.closedQty || 0
        tradeRef.closedAmt = tradeRef.closedAmt || 0
        thisTrade.openedAmt = thisTrade.openedAmt || 0
        thisTrade.openedQty = thisTrade.openedQty || 0

        // if the closing trade is bigger than the earliest buy trade
        // you will need to go through another
        if (thisTrade.quantity > (tradeRef.quantity - tradeRef.closedQty)) {
          closedCount += tradeRef.quantity - tradeRef.closedQty
          thisTrade.openedAmt += tradeRef.price * (tradeRef.quantity - tradeRef.closedQty) * 100
          thisTrade.openedQty += tradeRef.quantity - tradeRef.closedQty
          tradeRef.closedAmt += thisTrade.price * (tradeRef.quantity - tradeRef.closedQty) * 100
          tradeRef.closedQty = tradeRef.quantity

          // close out the rest on the next open trade
          r.openTrades.shift()

        // else you can close everything on the first trade
        } else {
          tradeRef.closedQty += thisTrade.quantity
          tradeRef.closedAmt += thisTrade.price * (tradeRef.quantity - tradeRef.closedQty) * 100
          thisTrade.openedAmt = tradeRef.price * thisTrade.quantity * 100
          thisTrade.openedQty = thisTrade.quantity
          closedCount += thisTrade.quantity
        }
      }
    }

    tradeReturns[index] = r

    return null
  })

  console.log('tradeReturns')
  console.log(tradeReturns)

  // TODO only fetch data for open trades

  // fetch the quotes from our data provider and build the return string
  // TODO: call array unique here so duplicate symbols are reduced
  const fetchData = await marketDataHelper.getQuote(tradeListArr.map(joinStr => joinStr.symbol).join(','))

  // index market data by symbols
  const tradeLookup = {}
  for (const s in fetchData) {
    tradeLookup[fetchData[s].symbol] = fetchData[s]
  }

  // build the trade lines with returns
  const tradeListStr = tradeListArr.map(thisTrade => {
    // store the return for this trade
    let calcReturn
    // tt is for this trade
    const tt = thisTrade
    // const
    const initAmt = tt.quantity * tt.price * 100
    // closed amounts for this trade
    const closedAmt = tt.closedAmt || 0
    const closedQty = tt.closedQty || 0

    if (!tradeLookup[tt.symbol] && !tt.expired) {
      return 'Trade symbol not found: ' + tt.symbol
    }

    // sd is for sym data
    const sd = tradeLookup[tt.symbol]

    if (tt.expired) {
      if (closedQty === tt.quantity) {
        return `--- ${tt.tradeStr} [Closed] [Expired]`
      } else {
        // assume that any positions that weren't closed expired worthless
        calcReturn = (tt.action === 'BTO') ? closedAmt / initAmt - 1 : 1 - closedAmt / initAmt
        tt.tradeStr = `${tt.tradeStr} [Expired]`
      }

    // BTO and STO that are fully closed don't show returns
    // the return is on the corressponding BTC or STC
    } else if (tt.action === 'BTO' || tt.action === 'STO') {
      if (closedQty === tt.quantity) {
        return `--- ${tt.tradeStr} [Closed]`

      // completely open
      } else if (closedQty === 0) {
        const totalAmt = tt.quantity * sd.last * 100
        calcReturn = (tt.action === 'BTO') ? totalAmt / initAmt - 1 : 1 - totalAmt / initAmt

      // partially closed trades
      } else if (closedQty !== tt.quantity) {
        const totalAmt = tt.closedAmt + (tt.quantity - tt.closedQty) * sd.last * 100
        calcReturn = (tt.action === 'BTO') ? totalAmt / initAmt - 1 : 1 - totalAmt / initAmt
      }
    } else if (tt.action === 'BTC' || tt.action === 'STC') {
      if ((tt.openedQty || 0) === tt.quantity) {
        calcReturn = (tt.action === 'STC') ? initAmt / tt.openedAmt - 1 : 1 - initAmt / tt.openedAmt
      } else {
        console.log('invalid open quantity: ' + tt.symbol)
        console.log(tt)
        console.log(tradeReturns[tt.trader + '|' + tt.symbol])
        return `${tt.action} invalid open quantity: ` + tt.symbol
      }
    } else {
      return thisTrade.tradeStr
    }

    calcReturn = (Math.round(calcReturn * 10000) / 100)
    if (calcReturn > 0) {
      return `+ ${tt.tradeStr} +${calcReturn}%`
    } else if (calcReturn < 0) {
      return `- ${tt.tradeStr} ${calcReturn}%`
    } else {
      return `--- ${tt.tradeStr} ${calcReturn}%`
    }
  })

  return tradeListStr
}

exports.getList = listTrades
