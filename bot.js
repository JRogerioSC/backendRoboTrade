require('dotenv').config();

const ccxt = require('ccxt');

const { aiDecision } = require('./ai');
const { calcTP, calcSL } = require('./risk');
const { broadcast } = require('./ws');

// ======================
// BYBIT
// ======================

const exchange = new ccxt.bybit({
    apiKey: process.env.BYBIT_API_KEY,
    secret: process.env.BYBIT_API_SECRET,

    enableRateLimit: true,

    options: {
        defaultType: 'spot', // spot primeiro (mais estável)
    }
});

const symbol = 'BTC/USDT';

let position = null;
let prices = [];

// ======================
// BOT
// ======================

async function bot() {

    try {

        // ======================
        // PREÇO
        // ======================

        const ticker = await exchange.fetchTicker(symbol);
        const price = ticker.last;

        // ======================
        // HISTÓRICO
        // ======================

        prices.push(price);

        if (prices.length > 50) {
            prices.shift();
        }

        // ======================
        // IA
        // ======================

        const decision = aiDecision(prices);

        let action = "WAITING";
        let profit = 0;

        // ======================
        // BUY
        // ======================

        if (!position && decision === "BUY") {

            const amount = 0.001;

            await exchange.createMarketBuyOrder(symbol, amount);

            position = {
                entryPrice: price,
                amount
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

            // TAKE PROFIT
            if (price >= tp) {

                await exchange.createMarketSellOrder(symbol, position.amount);

                action = "SELL_TP";
                position = null;

                console.log("TAKE PROFIT");
            }

            // STOP LOSS
            else if (price <= sl) {

                await exchange.createMarketSellOrder(symbol, position.amount);

                action = "SELL_SL";
                position = null;

                console.log("STOP LOSS");
            }
        }

        // ======================
        // FRONTEND
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

// ======================
// LOOP
// ======================

setInterval(bot, 2000);

console.log("BYBIT BOT RUNNING");