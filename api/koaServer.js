const Koa = require('koa')
const { ApolloServer } = require('apollo-server-koa')
const { typeDefs, resolvers } = require('./graphqlSchema')

const start = () => {
  const app = new Koa()
  const server = new ApolloServer({ typeDefs, resolvers })

  app.use(server.getMiddleware())

  app.listen({ port: process.env.PORT || 4000 }, () => 
    console.log(`🚀 Graphql server ready at http://localhost:4000${server.graphqlPath}`)
  )
}

exports.start = start
