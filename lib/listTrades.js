const { Op } = require('sequelize')
const dateFormat = require('dateformat')
const marketDataHelper = require('./marketDataHelper')
const inputParse = require('./inputParse')

function formatEnteredFilter (entered) {
  let t = entered
  let tMultiplier = 7
  let unit = 'week'
  if (t.substring(t.length - 4) === 'days') {
    unit = 'day'
    tMultiplier = 1
    t = parseInt(t.substring(0, t.length - 4))
  }

  if (t !== -1) unit += 's'

  const enteredDate = new Date(Date.now() + t * tMultiplier * 24 * 60 * 60 * 1000)

  return {
    enteredInt: t,
    enteredUnit: unit,
    enteredDate: enteredDate
  }
}

const listTrades = async (interaction, tradesTable, client) => {
  // get the arguments
  const args = {}
  if (interaction.data.options) {
    interaction.data.options.map(arg => {
      args[arg.name] = arg.value
      return null
    })
  }

  const defaultOrderBy = { order: [['trader', 'ASC'], ['expiry', 'ASC'], ['ticker', 'ASC'], ['strike', 'ASC'], ['id', 'ASC']] }
  const whereClause = {}
  // used for displaying the command entered by the user
  const initialCommand = ['/' + interaction.data.name]
  // used to display ids on each row, useed in caeses like delete where user needs to action
  const displayIds = {}

  // default is open options expiring in next 2 weeks
  // args.all option is from GraphQL API { name: 'all', value: true }
  if (Object.keys(args).length === 0 && !args.all) {
    args.range = 2
    args.status = 'open'
    args.default = true
  // args.top options are sent in obj { name: 'top', value: { length: 10 } }
  } else if (Object.keys(args).length === 1 && args.top) {
    args.measure = '%'
    args.status = 'closed'
    args.entered = '-4'
    args.default = true
  }

  if (args.trader) {
    let trader = args.trader

    // shoud be guaranteed to get user id, but just in case
    if (parseInt(trader)) {
      const user = await client.users.fetch(trader)
      trader = user.username
    }
    whereClause.trader = trader
    initialCommand.push('trader:' + trader)
  }

  if (args.ticker) {
    whereClause.ticker = args.ticker.toUpperCase()
    initialCommand.push('ticker:' + whereClause.ticker)
  }

  if (args.expiry) {
    const expiry = inputParse.dateParse(args.expiry)
    whereClause.expiry = {
      [Op.lt]: new Date(Date.parse(expiry.dateDB) + 12 * 60 * 60 * 1000),
      [Op.gt]: new Date(Date.parse(expiry.dateDB) - 12 * 60 * 60 * 1000)
    }
    initialCommand.push('expiry:' + expiry.dateDisplay)
  }

  // 3 statuses: open, closed, expired
  // open and closed are determined later after the tally
  if (args.status) {
    const status = args.status
    if (status === 'expired') {
      whereClause.expiry = {
        [Op.lt]: new Date(Date.now())
      }
    }

    initialCommand.push('status:' + status)
  }

  if (args.range) {
    if (args.range > 0) {
      whereClause.expiry = {
        [Op.lt]: new Date(Date.now() + args.range * 7 * 24 * 60 * 60 * 1000),
        [Op.gt]: new Date(Date.now())
      }
    } else {
      whereClause.expiry = {
        [Op.lt]: new Date(Date.now()),
        [Op.gt]: new Date(Date.now() + args.range * 7 * 24 * 60 * 60 * 1000)
      }
    }
    initialCommand.push('range:' + args.range + ((parseInt(args.range) === 1) ? ' week' : ' weeks'))
  }

  if (args.entered) {
    // this is further down and filters after all returns have been calculated
  }

  const tradesList = await tradesTable.findAll({ where: whereClause, ...defaultOrderBy })

  // do some formatting on the trades
  let tradeListArr = tradesList.map(trade => {
    const t = trade.expiry
    const utcStr = `${t.getUTCFullYear()}-${t.getUTCMonth() + 1}-${t.getUTCDate()}`
    const estStr = `${utcStr} 16:00:00 EST`

    // reformat expiryDate
    const expiryDateStr = dateFormat(utcStr + ' 00:00:00', 'mmm d' + ((t.getUTCFullYear().toString() === dateFormat('yyyy')) ? '' : '/yy'))
    const tradeStr = `@${trade.trader} ${trade.action} ${trade.quantity}x ${trade.ticker} ${expiryDateStr} $${trade.strike} ${trade.type.substring(0, 1)} $${trade.price}`

    // add the trade to the list
    return {
      tradeStr: tradeStr,
      symbol: marketDataHelper.buildOptionsSymbol(trade.ticker, utcStr, trade.type, trade.strike),
      expired: Date.now() > Date.parse(estStr),
      expiryStr: expiryDateStr,
      ...trade.dataValues
    }
  })

  // calculate the returns
  // assumption is that trades are sorted by execution date
  const tradeReturns = {}

  // first just tally everything up
  tradeListArr.map(thisTrade => {
    const tt = thisTrade
    const index = tt.trader + '|' + tt.symbol
    const saved = (tradeReturns[index]) ? tradeReturns[index] : {}

    const r = {
      symbol: index, // this is not really needed but helps debugging
      openQty: saved.openQty || 0,
      openTotalAmt: saved.openTotalAmt || 0,
      closeQty: saved.closeQty || 0,
      closeTotalAmt: saved.closeTotalAmt || 0,
      openTrades: saved.openTrades || [],
      expired: tt.expired
    }

    // first verify if this is a valid trade
    // user might enter STO->STC or STO->BTO
    // correct sequence should be STO->BTC or BTO->STC
    if ((tt.action === 'STC' && r.openQty <= 0) ||
      (tt.action === 'BTC' && r.openQty >= 0) ||
      (tt.action === 'STO' && r.openQty > 0) ||
      (tt.action === 'BTO' && r.openQty < 0)) {
      tt.invalid = true
      return null
    }

    if (tt.action === 'BTO' || tt.action === 'STO') {
      const signMod = (tt.action === 'BTO') ? 1 : -1
      r.openQty += tt.quantity * signMod
      r.openTotalAmt += tt.price * tt.quantity * 100 * signMod

      // keep track of open trades for this symbol's return
      // close them as position is closed
      r.openTrades.push({
        ref: tt
      })
    } else if (tt.action === 'BTC' || tt.action === 'STC') {
      const signMod = (tt.action === 'BTC') ? 1 : -1

      // update the return
      r.closeQty += tt.quantity * signMod
      r.closeTotalAmt += tt.price * tt.quantity * 100 * signMod

      // update the trades
      let closedCount = 0
      while (closedCount < tt.quantity) {
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
          console.log(tt)
          return null
        }
        tradeRef.closedQty = tradeRef.closedQty || 0
        tradeRef.closedAmt = tradeRef.closedAmt || 0
        tt.openedAmt = tt.openedAmt || 0
        tt.openedQty = tt.openedQty || 0

        // if thisTrade remaining open is bigger than the tradeRef remaining
        // you will need to go through another tradeRef
        const thisTradeRemain = tt.quantity - tt.openedQty
        const tradeRefRemain = tradeRef.quantity - tradeRef.closedQty
        if (thisTradeRemain > tradeRefRemain) {
          tradeRef.closedQty += tradeRefRemain // the remaining get closed
          tradeRef.closedAmt += tt.price * tradeRefRemain * 100
          tt.openedQty += tradeRefRemain // the remaining tradeRef get added to thisTrade
          tt.openedAmt += tradeRef.price * tradeRefRemain * 100
          closedCount += tradeRefRemain

          // close out the rest on the next open trade
          r.openTrades.shift()

        // else you can close everything left on thisTrade on tradeRef
        } else {
          tradeRef.closedQty += thisTradeRemain // the remaining thisTrade get added to tradeRef
          tradeRef.closedAmt += tt.price * thisTradeRemain * 100
          tt.openedQty += thisTradeRemain // the remaining get closed
          tt.openedAmt += tradeRef.price * thisTradeRemain * 100
          closedCount += thisTradeRemain
        }
      }
    }

    tradeReturns[index] = r

    return null
  })

  // finish up the status filter
  // open and expired are determined above
  // open is completed here
  if (args.status && args.status !== 'expired') {
    tradeListArr = tradeListArr.map(t => {
      const tr = tradeReturns[t.trader + '|' + t.symbol]

      try {
        if (args.status === 'closed') {
          return (
            tr.expired ||
            tr.openQty + tr.closeQty === 0 ||
            t.action === 'BTC' ||
            t.action === 'STC')
            ? t
            : null
        } else if (args.status === 'open') {
          return (
            tr.openQty + tr.closeQty !== 0 &&
            !tr.expired &&
            t.action !== 'BTC' &&
            t.action !== 'STC')
            ? t
            : null
        }
      } catch (e) {
        console.log('tr', tr)
        console.log('tradeReturns key = ', t.trader + '|' + t.symbol)
        console.log('e = ', e)
      }

      return t
    })

    tradeListArr = tradeListArr.filter(t => t !== null)
  }

  // check if we are filtering out this trade based on entered date
  if (args.entered) {
    const arg = formatEnteredFilter(args.entered)
    tradeListArr = tradeListArr.filter(t => t.createdAt > arg.enteredDate)
  }

  // TODO only fetch data for open trades

  // fetch the quotes from our data provider and build the return string
  // set is used to removes duplicates
  const fetchData = await marketDataHelper.getQuote([...new Set(tradeListArr.map(joinStr => joinStr.symbol))].join(','))

  // index market data by symbols
  const symPrice = {}
  for (const s in fetchData) {
    symPrice[fetchData[s].symbol] = fetchData[s]
  }

  // Get the stock prices of the expired options so we can price them
  // first: find the expired options
  const expiredTickerDates = tradeListArr.map(trade => (trade.expired) ? trade.ticker + '|' + trade.expiry.toISOString().substring(0, 10) : null)
  // second: remove duplicates and nulls
  const expiredTickerDatesUnique = expiredTickerDates.filter((a, b) => expiredTickerDates.indexOf(a) === b && a !== null)
  // third: get the data
  // map returns a bunch of promises so we need to wait until all are done with Promise.all
  const expiredPrices = {}
  await Promise.all(expiredTickerDatesUnique.map(async tickerDate => {
    const [ticker, date] = tickerDate.split('|')
    expiredPrices[tickerDate] = (await marketDataHelper.getHistoricalQuote(ticker, { start: date, end: date }))[0]
  }))

  // used for debugging, dump the tradeListArr
  // console.log(tradeListArr)

  // build the trade lines with returns
  const tradeListStr = tradeListArr.map((thisTrade, i) => {
    // tt is for this trade
    const tt = thisTrade
    // store the original index as sorting might occur later
    tt.i = i

    // store the return for this trade
    // r is the final return string
    let calcReturn
    let dollarReturn
    let r

    // check validity
    if (tt.invalid) {
      r = `--- ${tt.tradeStr} [Invalid]`
      tt.tradeStr2 = r
      return r
    } else if (!symPrice[tt.symbol] && !tt.expired) {
      r = `--- ${tt.tradeStr} [Sym not found: ${tt.symbol}]`
      tt.tradeStr2 = r
      return r
    }

    let preStr = ''
    if (args.ids) {
      preStr = (i + 1).toString() + '. '
      displayIds[i + 1] = tt.id
    }
    let postStr = (tt.expired) ? '[Exp]' : ''

    // BTO and STO that are fully closed don't show returns
    // the return is on the corressponding BTC or STC
    if (tt.action === 'BTO' || tt.action === 'STO') {
      // closed amounts for this trade
      const closedQty = tt.closedQty || 0

      if (closedQty === tt.quantity) {
        r = `--- ${preStr}${tt.tradeStr} [Closed] ${postStr}`.trim()
        tt.tradeStr2 = r
        return r
      } else {
        // if expired the price for the remaining non-closed qualitity is different
        if (tt.expired) {
          const expiredPrice = expiredPrices[tt.ticker + '|' + tt.expiry.toISOString().substring(0, 10)].close || 0
          if (expiredPrice === 0) {
            r = `--- ${preStr}${tt.tradeStr} [No historical price]`
            tt.tradeStr2 = r
            return r
          }

          // price for remaining is the difference with strike
          if (expiredPrice > tt.strike) {
            if (tt.type === 'Call') {
              // BTO by default
              calcReturn = (expiredPrice - tt.strike - tt.price) / tt.price
              dollarReturn = (expiredPrice - tt.strike - tt.price) * 100 * (tt.quantity - closedQty)

              if (tt.action === 'STO') {
                calcReturn *= -1
                dollarReturn *= -1
              }
            } else if (tt.type === 'Put') {
              // STO by default
              calcReturn = 1
              dollarReturn = tt.price * 100 * (tt.quantity - closedQty)

              if (tt.action === 'BTO') {
                calcReturn *= -1
                dollarReturn *= -1
              }
            }
          } else {
            if (tt.type === 'Call') {
              // STO by default
              calcReturn = 1
              dollarReturn = tt.price * 100 * (tt.quantity - closedQty)

              if (tt.action === 'BTO') {
                calcReturn *= -1
                dollarReturn *= -1
              }
            } else if (tt.type === 'Put') {
              // BTO by default
              calcReturn = (tt.strike - expiredPrice - tt.price) / tt.price
              dollarReturn = (tt.strike - expiredPrice - tt.price) * 100 * (tt.quantity - closedQty)

              if (tt.action === 'STO') {
                calcReturn *= -1
                dollarReturn *= -1
              }
            }
          }
          postStr = (closedQty > 0) ? `[${closedQty} Closed] [${tt.quantity - closedQty} Exp]` : `[${tt.quantity - closedQty} Exp]`
        } else {
          // sd is for symbol data
          const sd = symPrice[tt.symbol]

          // price for remaining is market value
          const totalAmt = sd.last * (tt.quantity - closedQty) * 100
          const principal = (tt.quantity - closedQty) * tt.price * 100
          // initial amount changes to reflect remaining only
          calcReturn = (tt.action === 'BTO') ? totalAmt / principal - 1 : 1 - totalAmt / principal
          dollarReturn = (tt.action === 'BTO') ? totalAmt - principal : principal - totalAmt
          if (closedQty > 0) postStr = `[${closedQty} Closed]`
        }
      }
    } else if (tt.action === 'BTC' || tt.action === 'STC') {
      if ((tt.openedQty || 0) === tt.quantity) {
        // initial price for thee trade
        const initAmt = tt.quantity * tt.price * 100

        calcReturn = (tt.action === 'STC') ? initAmt / tt.openedAmt - 1 : 1 - initAmt / tt.openedAmt
        dollarReturn = (tt.action === 'STC') ? initAmt - tt.openedAmt : tt.openedAmt - initAmt
      } else {
        r = `${preStr}${tt.action} invalid open quantity: ` + tt.symbol
        tt.tradeStr2 = r
        return r
      }
    } else {
      r = preStr + thisTrade.tradeStr
    }

    dollarReturn = Math.round(dollarReturn)
    calcReturn = (Math.round(calcReturn * 100))
    tt.calcReturn = calcReturn
    tt.dollarReturn = dollarReturn
    if (calcReturn > 0) {
      r = `+ ${preStr}${tt.tradeStr} [${calcReturn}%|$${dollarReturn}] ${postStr}`.trim()
    } else if (calcReturn < 0) {
      r = `- ${preStr}${tt.tradeStr} [${calcReturn}%|-$${dollarReturn * -1}] ${postStr}`.trim()
    } else {
      r = `${preStr}${tt.tradeStr} [${calcReturn}%|$${dollarReturn}] ${postStr}`.trim()
    }

    tt.tradeStr2 = r
    return r
  })

  if (args.entered) {
    const arg = formatEnteredFilter(args.entered)
    initialCommand.push(`entered: ${arg.enteredInt} ${arg.enteredUnit}`)
  }

  let filteredReturn = tradeListStr.filter(returnStr => returnStr !== null)

  // sort and only show top
  if (args.top) {
    // % by default
    const measure = ((args.measure || '%') === '%') ? 'calcReturn' : 'dollarReturn'
    let sortedTradeArr = tradeListArr.filter(trade => trade.calcReturn)
    sortedTradeArr = sortedTradeArr.sort((a, b) => b[measure] - a[measure])
    sortedTradeArr = sortedTradeArr.slice(0, args.top.length)

    filteredReturn = sortedTradeArr.map(trade => tradeListStr[trade.i])
  }

  if (args.default) initialCommand.push('[default]')
  return {
    command: initialCommand.join(' '),
    tradeList: filteredReturn,
    tradeData: tradeListArr,
    idsMap: displayIds
  }
}

exports.getList = listTrades
