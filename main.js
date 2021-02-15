require('dotenv').config()
const Discord = require('discord.js')
const Sequelize = require('sequelize')
const marketDataHelper = require('./lib/marketDataHelper')
const listTrades = require('./lib/listTrades')
const bookTrade = require('./lib/bookTrade')
const { book } = require('iexcloud_api_wrapper')
const ensureArray = require('ensure-array')

const client = new Discord.Client()
const env = process.env.ENVIRONMENT || 'DEV'
let sequelize = null
let PREFIX = '!'

if (env === 'PROD') {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false
  })
} else {
  sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite'
  })
  PREFIX = '#'
}

/*
 * equivalent to: CREATE TABLE trades(
 * id INT,
 * trader VARCHAR(255),
 * ticker VARCHAR(255),
 * type VARCHAR(255),
 * action VARCHAR(255),
 * expiry DATE,
 * strike FLOAT(8,2),
 * price FLOAT(8,2),
 * quantity INT
 * );
 */
const Trades = sequelize.define('trades', {
  guildId: Sequelize.INTEGER,
  trader: Sequelize.STRING,
  ticker: Sequelize.STRING,
  type: Sequelize.STRING,
  action: Sequelize.STRING,
  expiry: Sequelize.DATE,
  strike: Sequelize.DECIMAL,
  price: Sequelize.DECIMAL,
  quantity: Sequelize.INTEGER
})
 
client.once('ready', () => {
  if (env === 'PROD') {
    console.log('Stox bot is online')
  } else {
    console.log('JanTest bot is online')
  }

  Trades.sync()
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
  } else if (command === 'tradeinfo') {
    // [theta]
  } else if (command === 'listtrades') {
    msg.reply('This function is deprecated, please use /list')
  }
})

// Repond to booking a trade via a slash command
// TODO: Replace when Discord.js has implemented an official solution
client.ws.on('INTERACTION_CREATE', async interaction => {
  const command = interaction.data.name
  if (command === 'trade') {
    bookTrade.submit(interaction, Trades, client)
  } else if (command === 'list') {
    const { command, tradeList } = await listTrades.getList(interaction, Trades, client)

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
    const { command, tradeList } = await listTrades.getList(interaction, Trades, client)

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
    const { command, tradeList, idsMap } = await listTrades.getList(interaction, Trades, client)

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

            const trade = Trades.build({ id: idsMap[m.content] })
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
