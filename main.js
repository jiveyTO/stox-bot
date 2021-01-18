require('dotenv').config();
const Discord = require('discord.js');
const Sequelize = require('sequelize');
const dateFormat = require("dateformat");
const stockDataHelper = require("./lib/stockDataHelper");

const client = new Discord.Client();
const env = process.env.ENVIRONMENT || 'DEV';
let sequelize = null;
let PREFIX = '!';

if ( env === 'PROD' ) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false
    });
} else {
    sequelize = new Sequelize('database', 'user', 'password', {
        host: 'localhost',
        dialect: 'sqlite',
        logging: false,
        // SQLite only
        storage: 'database.sqlite',
    });
    PREFIX = '#';
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
});

client.once('ready', () => {
    if ( env === 'PROD' ) {
        console.log('Stox bot is online');
    } else {
        console.log('JanTest bot is online');
    }

    Trades.sync();
});

const questions = [
    { question: "What is the stock ticker?", answer: "" },
    { question: "Option type? (Call, Put)", answer: "" },
    { question: "Option action? (BTO, STO)", answer: "" },
    { question: "Expiry? (ie Jan 12)", answer: "" },
    { question: "Strike?", answer: "" },
    { question: "Price?", answer: "" },
    { question: "Quantity?", answer: "" }
]

client.on('message', async msg => {
    if (!msg.content.startsWith(PREFIX)) return;

    const input = msg.content.slice(PREFIX.length).trim().split(' ');
    const command = input.shift().toLowerCase();
    const commandArgs = input;

    if (command === 'ping') {
        msg.reply('Pong!');
    } else if (command === 'quote') {
        const sym = stockDataHelper.parseCommandForSymbol(commandArgs[0]);
        const embed = await stockDataHelper.stockQuoteMessageEmbed(sym);
        msg.channel.send(embed);
    } else if (command === 'booktrade') {
        askQuestion(msg, questions, 0);
        //msg.reply("im here at the end");
    } else if (command === 'edittrade') {
        // [zeta]
    } else if (command === 'tradeinfo') {
        // [theta]
    } else if (command === 'listtrades') {
        // equivalent to: SELECT * FROM trades WHERE trader=<userFilter>;

        let whereClause = {};
        userFilter = commandArgs[0];

        if ( userFilter ) {
            // if they enter their @username
            if ( userFilter.substring(0,3) === '<@!' ) {
                let user = await client.users.fetch(userFilter.substring(3,userFilter.length-1));
                userFilter = user.username;
            }
            whereClause = { where: { trader: userFilter } };
        }

        const tradesList = await Trades.findAll(whereClause);
        let tradeListStr = "";
        tradesList.map( trade => {
            const t = trade.expiry;
            const utcStr = `${t.getUTCFullYear()}-${t.getUTCMonth()+1}-${t.getUTCDate()}`;
            const estStr = `${utcStr} 16:00:00 EST`;

            // reformat expiryDate
            const expiryDateStr = dateFormat(utcStr, "mediumDate");            
            let tradeStr = `@${trade.trader}: ${trade.action} ${trade.quantity} x ${trade.ticker} ${expiryDateStr} $${trade.strike} ${trade.type} at $${trade.price}`;
            
            // check for an expired trade
            if ( Date.now() > Date.parse(estStr) ) {
                tradeStr = "---" + tradeStr + " [Expired]";
            }         

            // add the trade to the list
            tradeListStr += tradeStr + "\n";
        });
        msg.channel.send("```diff\n" + tradeListStr + "\n```");
    } 

});

// Repond to booking a trade via a slash command
// TODO: Replace when Discord.js has implemented an official solution
client.ws.on('INTERACTION_CREATE', async interaction => {

    const trade = formatTrade(interaction.data.options);

    const tradeStr = `<@${interaction.member.user.id}>: ${trade.action} ${trade.quantity} x ${trade.ticker}`
                     + ` ${trade.expiryDisplay} $${trade.strike} ${trade.type} at $${trade.price}`; 

    try {
        // equivalent to: INSERT INTO trades (trader, ticker, type, action, expiry, strike, price, quantity ) values (?, ?, ?, ?, ?, ?, ?, ?);
        const tag = await Trades.create({
            trader: interaction.member.user.username,
            ticker: trade.ticker,
            type: trade.type,
            action: trade.action,
            expiry: trade.expiry,
            strike: trade.strike,
            price: trade.price,
            quantity: trade.quantity
        });
   
        // Show the logged trade
        // Type 3 will eat the original message aka ephemeral
        client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
                type: 3,
                data: {
                    content: `⭐️ ${tradeStr}`
                }
            }
        })
    }
    catch (e) {
        let errStr = `Something went wrong with adding a trade for ${tradeStr}`; 

        if (e.name === 'SeqelizeUniqueConstraintError') {
            errStr = 'That trade already exists';
        }

        console.log("DB error = " + e);

        client.api.interactions(interaction.id, interaction.token).callback.post({data: {
            type: 3,
            data: {
                content: errStr
            }
        }
    })}

});


async function askQuestion(msg, questionsArray, index) {
    if(index+1>questionsArray.length) {
        const trade = formatTrade(questionsArray);

        // TODO remove this from here when askQuestion is made into a recursive promise
        try {
            // equivalent to: INSERT INTO trades (trader, ticker, type, action, expiry, strike, price, quantity ) values (?, ?, ?, ?, ?, ?, ?, ?);
            const tag = await Trades.create({
                trader: msg.author.username,
                ticker: trade.ticker,
                type: trade.type,
                action: trade.action,
                expiry: trade.expiry,
                strike: trade.strike,
                price: trade.price,
                quantity: trade.quantity
            });
        }
        catch (e) {
            if (e.name === 'SeqelizeUniqueConstraintError') {
                return msg.reply('That trade already exists');
            }
            console.log("DB error = " + e);
            return msg.reply('Something went wrong with adding a trade');
        }

        msg.channel.send(`⭐️ <@${msg.author.id}>: ${trade.action} ${trade.quantity} x ${trade.ticker} ${trade.expiryDisplay} $${trade.strike} ${trade.type} at $${trade.price}`);
        return;
    }

    // `m` is a message object that will be passed through the filter function
    const filter = m => m.author.id === msg.author.id;
    const collector = msg.channel.createMessageCollector(filter, { time: 60000, max: 1 });

    collector.on('collect', m => {
        questionsArray[index].answer = m.content;
    });

    collector.on('end', collected => {
        if(collected.size == 0) {
            msg.reply('Sorry I didn\'t get a response, try booking your trade again');
        } else {
            askQuestion(msg, questionsArray, index+1 );
        }
    });

    if ( index === 0 ) msg.reply("This function is deprecated, please use /trade next time.");
    msg.reply(questionsArray[index].question);
    //msg.channel.send(questionsArray[index].question);
}

// Returns a object representing a formatted trade
function formatTrade(trade) {
    let t = null;

    // Apply general field rules
    if ( trade[0].answer ) {
        t = trade.map( item => item.answer.trim() );
    } else if ( trade[0].value ) {
        t = trade.map( item => item.value );
    } else {
        console.log("Invalid trade array");
        return;
    }

    // Format ticker
    const ticker = t[0].toUpperCase();
    // Format type
    const type = t[1].charAt(0).toUpperCase() + t[1].slice(1).toLowerCase();

    // Format action
    const action = t[2].toUpperCase();

    // Format the year in case they didn't enter it
    const thisYear = dateFormat('yyyy'); 
    const enteredExpiry = t[3]; 
    const expiry = ((new Date(enteredExpiry)).getFullYear() < thisYear ) ? `${thisYear}-${dateFormat(enteredExpiry, "mm-dd")}` : dateFormat(enteredExpiry, "yyyy-mm-dd");
    const expiryDisplay = ((new Date(enteredExpiry)).getFullYear() < thisYear ) ? dateFormat(enteredExpiry, "mmm d") : dateFormat(enteredExpiry, "mmm d yyyy");
   
    // Format the currency
    const strike = ( t[4].charAt(0) == '$' ) ? t[4].slice(1) : t[4];
    const price = ( t[5].charAt(0) == '$' ) ? t[5].slice(1) : t[5];    

    return {
        "ticker": ticker,
        "type": type,
        "action": action,
        "expiry": expiry,
        "expiryDisplay": expiryDisplay,
        "strike": strike,
        "price": price,
        "quantity": t[6]
    }
}

function expireTradeOption(id) {

}

client.login(process.env.DISCORD_BOT_TOKEN);
