const Discord = require('discord.js');
const iex = require("iexcloud_api_wrapper");

/*

Quote {
  symbol: 'AAPL',
  companyName: 'Apple Inc',
  calculationPrice: 'close',
  open: 132,
  openTime: 1690885206175,
  close: 133.01,
  closeTime: 1643385719673,
  high: 134.59,
  low: 132.5,
  latestPrice: 135.2,
  latestSource: 'Close',
  latestTime: 'January 11, 2021',
  latestUpdate: 1647448603133,
  latestVolume: 101057573,
  iexRealtimePrice: 133.83,
  iexRealtimeSize: 200,
  iexLastUpdated: 1625562880765,
  delayedPrice: 131.71,
  delayedPriceTime: 1662107128503,
  extendedPrice: 132.44,
  extendedChange: 0.2,
  extendedChangePercent: 0.00151,
  extendedPriceTime: 1625035202211,
  previousClose: 135.2,
  change: -3.18,
  changePercent: -0.02423,
  iexMarketPercent: 0.012085528037077572,
  iexVolume: 1217294,
  avgTotalVolume: 121403614,
  iexBidPrice: 0,
  iexBidSize: 0,
  iexAskPrice: 0,
  iexAskSize: 0,
  marketCap: 2173454510776,
  week52High: 142.88,
  week52Low: 57.43,
  ytdChange: -0.0288338336507744,
  primaryExchange: 'AQMEGLALKAN GDB (EELNCTSA /SSRO)T',
  openSource: 'aolcifif',
  closeSource: 'fflciaio',
  highTime: 1625157740483,
  highSource: 'pi dnu dieeema1rye5t lc',
  lowTime: 1674516908262,
  lowSource: 'c 1d5iiemdaurnteyle  pe',
  oddLotDelayedPrice: 129.68,
  oddLotDelayedPriceTime: 1689520715030,
  previousVolume: 106410440,
  volume: 104349566,
  iexOpen: 129.18,
  iexOpenTime: 1678970755115,
  iexClose: 135.28,
  iexCloseTime: 1639990758067,
  peRatio: 39.76,
  lastTradeTime: 1621939414133,
  isUSMarketOpen: false
}

*/

const parseCommandForSymbol = (str) => {
    const symRegex = /\$?([A-Z\.\-]{1,5})/i;
    const matches = String(str).match(symRegex);
    const sym = matches[1];

    return sym;
}

const stockQuoteMessageEmbed = async (sym) => {
    let data;

    try {
        data = await iex.quote(sym);
    } catch (err) {
        return err.message;
    }

    const price = parseFloat(data.iexRealtimePrice).toFixed(2);
    const percentChange = parseFloat(data.changePercent*100).toFixed(2);
    const yahooUrl = `https://finance.yahoo.com/quote/${sym}?p=${sym}`;

    return new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`$${sym} - ${data.companyName}`)
        .setURL(yahooUrl)
        .addFields(
            { name: 'Current Price', value: `$${price}`, inline: true },
            { name: '% Change', value: `${percentChange}%`, inline: true },
            { name: '$ Change', value: `$${data.change}`, inline: true }
        );
}

exports.stockQuoteMessageEmbed = stockQuoteMessageEmbed;
exports.parseCommandForSymbol = parseCommandForSymbol;