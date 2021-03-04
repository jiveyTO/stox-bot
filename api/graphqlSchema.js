const { gql } = require('apollo-server-koa')
const listTrades = require('../lib/listTrades')
const { Trade } = require('../models')

const typeDefs = gql`
  type Query {
    trades: [Trade!]!
  }
  type Trade {
    id: ID
    trader: String
    ticker: String
    type: String
    action: String
    expiry: String
    strike: Float
    price: Float
    quantity: Int
    returnPercent: Float
    returnDollar: Float
    closedAmt: Int
    expiredAmt: Int
  }
`

exports.typeDefs = typeDefs

const resolvers = {
  Query: {
    trades: async () => {
      // typically getList is called with an interaction event
      // this is a hack and getList should be refactored
      const interaction = {
        data: {
          name: 'graphql',
          options: [{ name: 'all', value: true }]
        }
      }
      // client is used only to get the trader's names from ids
      // this is a hack and getList should be refactored
      const client = {}

      const { tradeData } = await listTrades.getList(interaction, Trade, client)

      return tradeData.map(trade => {
        trade.expiry = trade.expiryStr
        trade.closedAmt = trade.closedQty || 0
        trade.expiredAmt = (trade.expired) ? trade.quantity - (trade.closedQty || 0) : 0
        trade.returnPercent = trade.calcReturn
        trade.returnDollar = trade.dollarReturn
        return trade
      })
    }
  }
}

exports.resolvers = resolvers
