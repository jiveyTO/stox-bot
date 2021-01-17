
require('dotenv').config();
const apiEndpoint = 'https://discord.com/api/v8/applications/' + process.env.DISCORD_BOT_ID + '/guilds/' + process.env.DISCORD_GUILD_ID + '/commands'
const botToken = process.env.DISCORD_BOT_TOKEN
const commandData = {
    "name": "trade",
    "description": "Book an options trade",
    "options": [
        {
            "name": "ticker",
            "description": "Stock ticker",
            "type": 3,
            "required": true
        },
        {
            "name": "type",
            "description": "Option type",
            "type": 3,
            "choices": [
                {
                    "name": "Call",
                    "value": "Call"
                },
                {
                    "name": "Put",
                    "value": "Put"
                }
            ],
            "required": true
        },
        {
            "name": "action",
            "description": "Option action",
            "type": 3,
            "choices": [
                {
                    "name": "BTO",
                    "value": "BTO"
                },
                {
                    "name": "STO",
                    "value": "STO"
                },
                {
                    "name": "BTC",
                    "value": "BTC"
                },
                {
                    "name": "STC",
                    "value": "STC"
                }
            ],
            "required": true            
        },
        {
            "name": "expiry",
            "description": "Option expiry date (May 4 or May 4 2021 or May 4 2023)",
            "type": 3,
            "required": true
        },         
        {
            "name": "strike",
            "description": "Strike price",
            "type": 3,
            "required": true
        },    
        {
            "name": "price",
            "description": "Option price",
            "type": 3,
            "required": true
        }, 
        {
            "name": "quantity",
            "description": "Quantity",
            "type": 4,
            "required": true
        }            
    ]
}

async function main () {
  const fetch = require('node-fetch')

  const response = await fetch(apiEndpoint, {
    method: 'post',
    body: JSON.stringify(commandData),
    headers: {
      'Authorization': 'Bot ' + botToken,
      'Content-Type': 'application/json'
    }
  })
  const json = await response.json()

  console.log(json)
}

main()