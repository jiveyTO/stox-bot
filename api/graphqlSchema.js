const { gql, AuthenticationError } = require('apollo-server-koa')
const listTrades = require('../lib/listTrades')
const { Trade, Settings } = require('../models')

const typeDefs = gql`
  type Query {
    trades: [Trade!]!
    login(email: String!, password: String!): String!
    alerts(guild: String!): [Alert!]!
  }
  type Trade {
    id: ID
    trader: String!
    ticker: String!
    type: String!
    action: String!
    expiry: String!
    expiryStr: String
    strike: Float!
    price: Float!
    quantity: Int!
    principal: Float
    returnPercent: Float
    returnDollar: Float
    closedAmt: Int
    expiredAmt: Int
  }
  type Alert {
    guild: String!
    name: String!
    value: String!
  }
`

exports.typeDefs = typeDefs

const resolvers = {
  Query: {
    login: (_, { email, password }, context) => {
      const jwt = context.models.User.login(email, password)

      if (!jwt) throw new AuthenticationError('Invalid credentials')

      return jwt
    },
    trades: async (_, __, context) => {
      const loggedIn = context.models.User.loggedIn()

      if (!loggedIn) throw new AuthenticationError('Invalid credentials')

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

      console.log('****')
      console.log('**** making expensive call to getList for the trades ****')
      console.log('****')
      const { tradeData } = await listTrades.getList(interaction, Trade, client)

      return tradeData.map(trade => {
        trade.closedAmt = trade.closedQty || 0
        trade.expiredAmt = (trade.expired) ? trade.quantity - (trade.closedQty || 0) : 0
        trade.returnPercent = trade.calcReturn
        trade.returnDollar = trade.dollarReturn
        return trade
      })
    },
    alerts: async (_, { guild }, context) => {
      const loggedIn = context.models.User.loggedIn()

      if (!loggedIn) throw new AuthenticationError('Invalid credentials')

      const whereClause = { category: 'alert' }
      const alertsList = await Settings.findAll({ where: whereClause })

      return alertsList
    }
  }
}

exports.resolvers = resolvers
