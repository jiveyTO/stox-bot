require('dotenv').config()
const Discord = require('discord.js')
const Sequelize = require('sequelize')
const marketDataHelper = require('./lib/marketDataHelper')
const listTrades = require('./lib/listTrades')
const bookTrade = require('./lib/bookTrade')
const { book } = require('iexcloud_api_wrapper')

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
    // msg.reply("im here at the end");
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
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
