
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

let apiEndpoint = 'https://discord.com/api/v8/applications/' + process.env.DISCORD_BOT_ID + '/guilds/' + process.env.DISCORD_GUILD_ID + '/commands'
if (process.argv[3] === 'global') {
  apiEndpoint = 'https://discord.com/api/v8/applications/' + process.env.DISCORD_BOT_ID + '/commands'
}
const botToken = process.env.DISCORD_BOT_TOKEN

const commandDataTrade = {
  name: 'trade',
  description: 'Book an options trade',
  options: [
    {
      name: 'ticker',
      description: 'Stock ticker',
      type: 3,
      required: true
    },
    {
      name: 'type',
      description: 'Option type',
      type: 3,
      choices: [
        {
          name: 'Call',
          value: 'Call'
        },
        {
          name: 'Put',
          value: 'Put'
        }
      ],
      required: true
    },
    {
      name: 'action',
      description: 'Option action',
      type: 3,
      choices: [
        {
          name: 'BTO',
          value: 'BTO'
        },
        {
          name: 'STO',
          value: 'STO'
        },
        {
          name: 'BTC',
          value: 'BTC'
        },
        {
          name: 'STC',
          value: 'STC'
        }
      ],
      required: true
    },
    {
      name: 'expiry',
      description: 'Option expiry date (May 4 or May 4 2021 or May 4 2023)',
      type: 3,
      required: true
    },
    {
      name: 'strike',
      description: 'Strike price',
      type: 3,
      required: true
    },
    {
      name: 'price',
      description: 'Option price',
      type: 3,
      required: true
    },
    {
      name: 'quantity',
      description: 'Quantity',
      type: 4,
      required: true
    }
  ]
}

const commandDataList = {
  name: 'list',
  description: 'List trades',
  options: [
    {
      name: 'trader',
      description: 'Show trades for a certain user',
      type: 6,
      required: false
    },
    {
      name: 'ticker',
      description: 'Show trades for a certain stock',
      type: 3,
      required: false
    },
    {
      name: 'expiry',
      description: 'Show trades for a particular expiry date',
      type: 3,
      required: false
    },
    {
      name: 'status',
      description: 'Filter for a particular status',
      type: 3,
      choices: [
        {
          name: 'Open',
          value: 'open'
        },
        {
          name: 'Closed',
          value: 'closed'
        },
        {
          name: 'Expired',
          value: 'expired'
        }
      ],
      required: false
    },
    {
      name: 'range',
      description: 'Expiry range',
      type: 3,
      choices: [
        {
          name: '-2 weeks',
          value: '-2'
        },
        {
          name: '-1 week',
          value: '-1'
        },
        {
          name: '+1 week',
          value: '1'
        },
        {
          name: '+2 weeks',
          value: '2'
        }
      ],
      required: false
    },
    {
      name: 'entered',
      description: 'Filter by trade enter date',
      type: 3,
      choices: [
        {
          name: '-1 week',
          value: '-1'
        },
        {
          name: '-2 weeks',
          value: '-2'
        },
        {
          name: '-3 weeks',
          value: '-3'
        },
        {
          name: '-4 weeks',
          value: '-4'
        }
      ],
      required: false
    }
  ]
}

const commandDataDelete =
  {
    name: 'delete',
    description: 'Lists your trades, from which you can select one to delete',
    options: [
      {
        name: 'ticker',
        description: 'Show trades for a certain stock',
        type: 3,
        required: true
      },
      {
        name: 'expiry',
        description: 'Show trades for a particular expiry date',
        type: 3,
        required: false
      }
    ]
  }

const commandDataTop =
  {
    name: 'top',
    description: 'List the top trades',
    options: [
      {
        name: 'measure',
        description: 'Measured by dollar amount or precentage',
        type: 3,
        choices: [
          {
            name: '%',
            value: '%'
          },
          {
            name: '$',
            value: '$'
          }
        ],
        required: false
      },
      {
        name: 'status',
        description: 'Filter for a particular status',
        type: 3,
        choices: [
          {
            name: 'Open',
            value: 'open'
          },
          {
            name: 'Closed',
            value: 'closed'
          },
          {
            name: 'Expired',
            value: 'expired'
          }
        ],
        required: false
      },
      {
        name: 'entered',
        description: 'Filter by trade enter date',
        type: 3,
        choices: [
          {
            name: '-12 weeks',
            value: '-12'
          },
          {
            name: '-8 weeks',
            value: '-8'
          },
          {
            name: '-4 weeks',
            value: '-4'
          },
          {
            name: '-1 weeks',
            value: '-1'
          }
        ],
        required: false
      }
    ]
  }

async function main () {
  const fetch = require('node-fetch')

  let command = ''

  switch (process.argv[2]) {
    case 'trade':
      command = commandDataTrade
      break
    case 'list':
      command = commandDataList
      break
    case 'delete':
      command = commandDataDelete
      break
    case 'top':
      command = commandDataTop
      break
    default:
      console.log('You must enter a command')
      command = 'nothing'
  }

  const response = await fetch(apiEndpoint, {
    method: 'post',
    body: JSON.stringify(command),
    headers: {
      Authorization: 'Bot ' + botToken,
      'Content-Type': 'application/json'
    }
  })
  const json = await response.json()

  console.log(JSON.stringify(json))
}

main()
