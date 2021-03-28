const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '/../.env') })
const Discord = require('discord.js')
const { Trade } = require('../models')
const listTrades = require('../lib/listTrades')

const client = new Discord.Client()
const env = process.env.ENVIRONMENT || 'DEV'

// TODO hard coded for now
const channelId = (env === 'DEV') ? '798776679723565057' : '777541535214469191'

async function weeklyTopTrade (channel) {
  // typically getList is called with an interaction event
  // this is a hack and getList should be refactored
  // get the trades entered in the last week
  const interaction = {
    data: {
      name: 'top',
      options: [
        { name: 'top', value: { length: 1 } },
        { name: 'entered', value: '-1' }
      ]
    }
  }

  // client is used only to get the trader's names from ids
  // this is a hack and getList should be refactored
  const client = {}

  const { tradeData } = await listTrades.getList(interaction, Trade, client)

  // now get the trades expired in the last week
  const interaction2 = {
    data: {
      name: 'top',
      options: [
        { name: 'top', value: { length: 1 } },
        { name: 'range', value: '-1' }
      ]
    }
  }

  const { tradeData: tradeData2 } = await listTrades.getList(interaction2, Trade, client)
  const concatData = tradeData.concat(tradeData2)

  // first sort by calcReturn
  let sortedTradeArr = concatData.filter(trade => trade.calcReturn > 0)
  sortedTradeArr = sortedTradeArr.sort((a, b) => b.calcReturn - a.calcReturn)

  // then if there's a tie for first sort by dollarReturn
  const topCalcReturn = sortedTradeArr[0].calcReturn
  sortedTradeArr = sortedTradeArr.filter(trade => trade.calcReturn === topCalcReturn)
  sortedTradeArr = sortedTradeArr.sort((a, b) => b.dollarReturn - a.dollarReturn)

  channel.send('Trade of the week:')
  channel.send('```diff\n' + sortedTradeArr[0].tradeStr2 + '\n```')
}

client.once('ready', () => {
  if (env === 'PROD') {
    console.log('Stox bot is online')
  } else {
    console.log('JanTest bot is online')
  }

  client.guilds.fetch(process.env.DISCORD_GUILD_ID)
    .then(guild => {
      if (!guild.available) return null

      const textChannel = guild.channels.resolve(channelId)
      if (!textChannel) return null

      const n = (new Date()).getDay()
      if (n !== 0) return null

      weeklyTopTrade(textChannel)
    })
    .catch(err => {
      console.log('🚀 ~ alert-weekly-top-trade ~ client.once ~ err', err)
    })
})

// shut down bot after 4s
client.setTimeout(() => { client.destroy() }, 4000)

client.login(process.env.DISCORD_BOT_TOKEN)
