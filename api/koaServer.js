const Koa = require('koa')
const { ApolloServer } = require('apollo-server-koa')
const { typeDefs, resolvers } = require('./graphqlSchema')

const start = () => {
  const app = new Koa()
  const server = new ApolloServer({ typeDefs, resolvers })

  app.use(server.getMiddleware())

  const apiPort = process.env.PORT || 4000
  app.listen({ port: apiPort }, () =>
    console.log(`🚀 Graphql server ready at http://localhost:${apiPort}${server.graphqlPath}`)
  )
}

exports.start = start
