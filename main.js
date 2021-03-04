require('dotenv').config()
const Discord = require('discord.js')
const { sequelize, Trade } = require('./models')
const marketDataHelper = require('./lib/marketDataHelper')
const listTrades = require('./lib/listTrades')
const bookTrade = require('./lib/bookTrade')
const ensureArray = require('ensure-array')
const koa = require('./api/koaServer')

// start the api server
koa.start()

// start the discord server
const client = new Discord.Client()
const env = process.env.ENVIRONMENT || 'DEV'
let PREFIX = '!'

if (env === 'PROD') {
  console.log('You are on PROD and your database url is ' + process.env.DATABASE_URL)
} else {
  PREFIX = '#'
}

client.once('ready', async () => {
  if (env === 'PROD') {
    console.log('Stox bot is online')
  } else {
    console.log('JanTest bot is online')
  }

  await sequelize.sync()
})

client.on('message', async msg => {
  if (!msg.content.startsWith(PREFIX)) return

  const input = msg.content.slice(PREFIX.length).trim().split(' ')
  const command = input.shift().toLowerCase()
  const commandArgs = input

  if (command === 'ping') {
    msg.reply('Pong!')
  // quote <stock symbol>
  } else if (command === 'quote') {
    const embed = await marketDataHelper.quoteMessageEmbed(commandArgs[0])
    msg.channel.send(embed)
  } else if (command === 'booktrade') {
    msg.reply('This function is deprecated, please use /trade')
  } else if (command === 'edittrade') {
    // [zeta]
  } else if (command === 'listtrades') {
    msg.reply('This function is deprecated, please use /list')
  }
})

// Repond to booking a trade via a slash command
// TODO: Replace when Discord.js has implemented an official solution
client.ws.on('INTERACTION_CREATE', async interaction => {
  const command = interaction.data.name
  if (command === 'trade') {
    bookTrade.submit(interaction, Trade, client)
  } else if (command === 'list') {
    const { command, tradeList } = await listTrades.getList(interaction, Trade, client)

    // there's a 2000 char limit when posting to Discord
    const pageSize = 25
    client.channels.fetch(interaction.channel_id)
      .then(channel => {
        channel.send(command)
        for (let i = 0; i < tradeList.length; i += pageSize) {
          const end = (i + pageSize > tradeList.length) ? tradeList.length : i + pageSize
          channel.send('```diff\n' + tradeList.slice(i, end).join('\n') + '\n```')
        }
      })
      .catch(console.error)
  } else if (command === 'top') {
    interaction.data.options = ensureArray(interaction.data.options)
    interaction.data.options.push({ name: 'top', value: { length: 10 } })
    const { command, tradeList } = await listTrades.getList(interaction, Trade, client)

    client.channels.fetch(interaction.channel_id)
      .then(channel => {
        channel.send(command)
        // trade list is likely no more than top 10
        channel.send('```diff\n' + tradeList.join('\n') + '\n```')
      })
  } else if (command === 'delete') {
    // Options will also have at least the ticker
    interaction.data.options.push({ name: 'trader', value: interaction.member.user.username })
    interaction.data.options.push({ name: 'ids', value: true })
    const { command, tradeList, idsMap } = await listTrades.getList(interaction, Trade, client)

    // there's a 2000 char limit when posting to Discord
    const pageSize = 25
    client.channels.fetch(interaction.channel_id)
      .then(channel => {
        channel.send(command)
        for (let i = 0; i < tradeList.length; i += pageSize) {
          const end = (i + pageSize > tradeList.length) ? tradeList.length : i + pageSize
          channel.send('```diff\n' + tradeList.slice(i, end).join('\n') + '\n```')
        }

        return channel
      })
      .then(channel => {
        channel.send('Which id do you want to delete?')

        const filter = m => m.author.id === interaction.member.user.id
        const collector = channel.createMessageCollector(filter, { max: 1, time: 15000 })

        collector.on('collect', m => {
          if (idsMap[m.content]) {
            const deleteStr = tradeList[m.content - 1].split(' ').slice(3, 11).join(' ')
            channel.send(`Id ${m.content} was deleted: ${deleteStr}`)

            const trade = Trade.build({ id: idsMap[m.content] })
            trade.destroy()
          } else {
            channel.send(`Invalid id: ${m.content}`)
          }
        })

        collector.on('end', collected => {
          if (collected.size === 0) channel.send('Your request to /delete timed out without receiving a valid id')
        })
      })
      .catch(error => {
        console.log('Error with client.channels.fetch')
        console.error(error)
      })
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
