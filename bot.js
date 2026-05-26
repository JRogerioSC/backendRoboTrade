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
        defaultType: 'spot',
        adjustForTimeDifference: false
    }
});

const symbol = 'BTC/USDT';

let position = null;
let prices = [];
let marketsLoaded = false;

// ======================
// LOAD MARKETS
// ======================

async function initMarkets() {

    try {

        if (!marketsLoaded) {

            await exchange.loadMarkets();

            marketsLoaded = true;

            console.log('MARKETS LOADED');
        }

    } catch (err) {

        console.log('LOAD MARKETS ERROR:', err.message);
    }
}

// ======================
// BOT
// ======================

async function bot() {

    try {

        // carrega mercados apenas 1x
        if (!marketsLoaded) {
            await initMarkets();
        }

        const ticker = await exchange.fetchTicker(symbol);

        const price = ticker.last;

        prices.push(price);

        if (prices.length > 50) {
            prices.shift();
        }

        const decision = aiDecision(prices);

        let action = "WAITING";

        let profit = 0;

        // ======================
        // BUY
        // ======================

        if (!position && decision === "BUY") {

            position = {
                entryPrice: price
            };

            action = "BUY";

            console.log("BUY", price);
        }

        // ======================
        // POSITION
        // ======================

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

        // ======================
        // SEND FRONTEND
        // ======================

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