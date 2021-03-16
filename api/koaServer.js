const Koa = require('koa')
const { ApolloServer } = require('apollo-server-koa')
const { typeDefs, resolvers } = require('./graphqlSchema')
const { getUser, generateUserModel } = require('../lib/userHelper')

const start = () => {
  const app = new Koa()
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ ctx }) => {
      const token = ctx.request.header.authorization || ''
      const user = getUser(token)

      return {
        user,
        models: {
          User: generateUserModel({ user })
        }
      }
    }
  })

  app.use(server.getMiddleware())

  const apiPort = process.env.PORT || 4000
  app.listen({ port: apiPort }, () =>
    console.log(`🚀 Graphql server ready at http://localhost:${apiPort}${server.graphqlPath}`)
  )
}

exports.start = start
