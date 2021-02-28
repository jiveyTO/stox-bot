const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '/../.env') })
const Discord = require('discord.js')
const { Trade } = require('../models')
const listTrades = require('../lib/listTrades')

const client = new Discord.Client()
const env = process.env.ENVIRONMENT || 'DEV'

//TODO hard coded for now
const channelId = (env === 'DEV') ? '798776679723565057' : '777541535214469191'

async function alertYesterdaysTrades (channel) {
  // typically getList is called with an interaction event
  // this is a hack and getList should be refactored
  const interaction = {
    name: 'list',
    data: {
      options: [
        { name: 'entered', value: '-1days' }
      ]
    }
  }
  // client is used only to get the trader's names from ids
  // this is a hack and getList should be refactored
  const client = {}

  const { tradeList } = await listTrades.getList(interaction, Trade, client)

  // there's a 2000 char limit when posting to Discord
  const pageSize = 25
  channel.send('Summary of yesterday\'s trades:')
  for (let i = 0; i < tradeList.length; i += pageSize) {
    const end = (i + pageSize > tradeList.length) ? tradeList.length : i + pageSize
    channel.send('```diff\n' + tradeList.slice(i, end).join('\n') + '\n```')
  }
}

client.once('ready', () => {
  if (env === 'PROD') {
    console.log('Stox bot is online')
  } else {
    console.log('JanTest bot is online')
  }

  client.guilds.fetch(process.env.DISCORD_GUILD_ID)
    .then(guild => {
      if (guild.available) {
        const textChannel = guild.channels.resolve(channelId)
        if (textChannel) {
          const n = (new Date()).getDay()
          if (n > 1 && n < 7) {
            alertYesterdaysTrades(textChannel)
            // client.destroy()
          }
        }
      }
    })
    .catch(err => {
      console.log(err)
    })
})

// shut down bot after 4s
client.setTimeout(() => { client.destroy() }, 4000)

client.login(process.env.DISCORD_BOT_TOKEN)
