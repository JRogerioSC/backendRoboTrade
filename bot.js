require('dotenv').config();

const ccxt = require('ccxt');

const { aiDecision } = require('./ai');
const { calcTP, calcSL } = require('./risk');
const { broadcast } = require('./ws');

const exchange = new ccxt.bybit({
    apiKey: process.env.API_KEY,
    secret: process.env.API_SECRET,
    enableRateLimit: true,
    options: {
        adjustForTimeDifference: true
    }
});

const symbol = 'BTC/USDT';

let position = null;
let prices = [];

async function bot() {

    try {

        const ticker = await exchange.fetchTicker(symbol);
        const price = ticker.last;

        prices.push(price);
        if (prices.length > 50) prices.shift();

        const decision = aiDecision(prices);

        let action = "WAITING";
        let profit = 0;

        if (!position && decision === "BUY") {

            position = { entryPrice: price };
            action = "BUY";

            console.log("BUY", price);
        }

        if (position) {

            profit = price - position.entryPrice;

            const tp = calcTP(position.entryPrice);
            const sl = calcSL(position.entryPrice);

            if (price >= tp) {

                action = "SELL_TP";
                console.log("TAKE PROFIT");
                position = null;
            }

            else if (price <= sl) {

                action = "SELL_SL";
                console.log("STOP LOSS");
                position = null;
            }
        }

        broadcast({
            price,
            action,
            position,
            profit,
            decision
        });

        console.log({
            price,
            action,
            position,
            profit
        });

    } catch (err) {
        console.log("BOT ERROR:", err.message);
    }
}

setInterval(bot, 2000);

console.log("AI BOT RUNNING");