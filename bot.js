require('dotenv').config();

const ccxt = require('ccxt');

const { aiDecision } = require('./ai');
const { calcTP, calcSL } = require('./risk');
const { broadcast } = require('./ws');

// ======================
// BINANCE
// ======================

const exchange = new ccxt.binance({
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

            // ORDEM REAL

            await exchange.createMarketBuyOrder(
                symbol,
                0.001
            );

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

            // TAKE PROFIT

            if (price >= tp) {

                await exchange.createMarketSellOrder(
                    symbol,
                    0.001
                );

                action = "SELL_TP";

                console.log("TAKE PROFIT");

                position = null;
            }

            // STOP LOSS

            else if (price <= sl) {

                await exchange.createMarketSellOrder(
                    symbol,
                    0.001
                );

                action = "SELL_SL";

                console.log("STOP LOSS");

                position = null;
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

console.log("AI BOT RUNNING");