# STOX Discord Bot

## Available Commands

1.  `!quote <stock symbol|option symbol>`

    Returns the current stock or options quote in the channel. Option symbol format e.g. "AAPL210115C00123500"

2.  `/trade <ticker> <type> <action> <expiry> <strike> <price> <quantity>`

    Book an options trade

## Setup

### Requirements

- Node v12.19

### Environment Variables

1. DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<db>
2. ENVIRONMENT=DEV|PROD
3. DISCORD_BOT_TOKEN=<Discord Bot Token>
4. IEXCLOUD_API_VERSION=stable
5. IEXCLOUD_PUBLIC_KEY=<IEX Cloud Public Key>
6. IEXCLOUD_SECRET_KEY=<IEX Cloud Secret Key>
7. TRADIER_ACCESS_TOKEN=<Tradier Access Tokern>
8. TRADIER_ENDPOINT=sandbox

### Installation

`npm install`

### Start Server

`npm start`

### Run Tests

`npm test`

### Dependencies

1. [Discord](https://discordjs.guide) - Discord SDK
2. [IEX Cloud](https://iexcloud.io) - Real-time US Market Data SDK
3. [Tradier](https://documentation.tradier.com/brokerage-api) - US Market Data SDK
