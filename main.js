const Discord = require('discord.js');
const Sequelize = require('sequelize');
const dateFormat = require("dateformat");

const client = new Discord.Client();
const PREFIX = '!';
const env = 'PROD';
let sequelize = null;

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
}


/*
 * equivalent to: CREATE TABLE tags(
 * name VARCHAR(255),
 * description TEXT,
 * username VARCHAR(255),
 * usage INT
 * );
 */
const Tags = sequelize.define('tags', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
	description: Sequelize.TEXT,
	username: Sequelize.STRING,
	usage_count: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

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
    if ( env === 'DEV' ) {
        console.log('JanTest bot is online');
    } else {
        console.log('Stox bot is online');
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
    } else if (command === 'booktrade') {
        askQuestion(msg, questions, 0);
        //msg.reply("im here at the end");
    } else if (command === 'addtrade') {
        // [delta]

        const splitArgs = commandArgs.split(' ');
        const tagName = splitArgs.shift();
        const tagDescription = splitArgs.join(' ');

        try {
            // equivalent to: INSERT INTO tags (name, description, username) values (?, ?, ?);
            const tag = await Tags.create({
                name: tagName,
                description: tagDescription,
                username: msg.author.username,
            });
            return msg.reply(`Tag ${tag.name} added.`);
        }
        catch (e) {
            if (e.name === 'SeqelizeUniqueConstraintError') {
                return msg.reply('That tag already exists');
            }
            return msg.reply('Something went wrong with adding a tag');
        }
    } else if (command === 'edittrade') {
        // [zeta]
    } else if (command === 'tradeinfo') {
        // [theta]
    } else if (command === 'listtrades') {
        // equivalent to: SELECT * FROM trades WHERE trader=<userFilter>;
        
        let whereClause = {};
        userFilter = commandArgs[0];

        if ( userFilter ) {
            // If they enter their @username
            if ( userFilter.substring(0,3) === '<@!' ) {
                let user = await client.users.fetch(userFilter.substring(3,userFilter.length-1));
                userFilter = user.username;
            }
            whereClause = { where: { trader: userFilter } }; 
        }

        const tradesList = await Trades.findAll(whereClause);
        tradesList.map( trade => {
            const tradeDate = dateFormat(trade.expiry, "mediumDate");
            msg.channel.send(`@${trade.trader}: ${trade.action} ${trade.quantity} x ${trade.ticker} ${tradeDate} ${trade.strike} ${trade.type} at $${trade.price}`);
        });
    } else if (command === 'removetag') {
        // [mu]
    }


})


async function askQuestion(msg, questionsArray, index) {
    console.log(`Index = ${index}`);
    if(index+1>questionsArray.length) {
        console.log(questionsArray);
        msg.reply(`⭐️ ${questionsArray[2].answer} ${questionsArray[6].answer} x ${questionsArray[0].answer} ${questionsArray[3].answer} ${questionsArray[4].answer} ${questionsArray[1].answer} at $${questionsArray[5].answer} `);

        const thisYear = dateFormat('yyyy'); 
        const enteredExpiry = questionsArray[3].answer; 
        const expiry = ((new Date(enteredExpiry)).getFullYear() < thisYear ) ? `${dateFormat(enteredExpiry, "mmm d")} ${thisYear}` : dateFormat(enteredExpiry, "mmm d yyyy");
        
        // TODO remove this from here when askQuestion is made into a recursive promise
        try {
            // equivalent to: INSERT INTO trades (trader, ticker, type, action, expiry, strike, price, quantity ) values (?, ?, ?, ?, ?, ?, ?, ?);
            const tag = await Trades.create({
                trader: msg.author.username,
                ticker: questionsArray[0].answer,
                type: questionsArray[1].answer,
                action: questionsArray[2].answer,
                expiry: expiry,
                strike: questionsArray[4].answer,
                price: questionsArray[5].answer,
                quantity: questionsArray[6].answer
            });
        }
        catch (e) {
            if (e.name === 'SeqelizeUniqueConstraintError') {
                return msg.reply('That trade already exists');
            }
            console.log("DB error = " + e);
            return msg.reply('Something went wrong with adding a trade');
        }
        return;
    }
    
    // `m` is a message object that will be passed through the filter function
    const filter = m => m.author.id === msg.author.id;
    const collector = msg.channel.createMessageCollector(filter, { time: 25000, max: 1 });

    collector.on('collect', m => {
        console.log(`Collected ${m.content}`);
        questionsArray[index].answer = m.content;
    });
        
    collector.on('end', collected => {
        console.log(`Collected ${collected.size} items`);

        if(collected.size == 0) {    
            msg.reply('Sorry I didn\'t get a response, try booking your trade again');
        } else {
            askQuestion(msg, questionsArray, index+1 );
        }
    });
    
    msg.reply(questionsArray[index].question);
    //msg.channel.send(questionsArray[index].question);
}

if ( env === 'DEV' ) {
    client.login('Nzk1NDEzNTA1NjQ5MTQ3OTA2.X_JAjQ.2kQKVx0rRDIi-zJADsJabkQPbgo'); // test JanTest bot
} else {
    client.login('Nzk2Mzg1MzM1MzE0ODc0MzY4.X_XJpA.OsfM7aNt9HlvBYNMrArc9CawWn8'); // live Stox bot
}