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

// ======================
// EVITA CHAMADAS PRIVADAS
// ======================

exchange.loadMarkets = async () => { };

const symbol = 'BTCUSDT';

let position = null;
let prices = [];

// ======================
// BOT LOOP
// ======================

async function bot() {

    try {

        // ======================
        // TICKER PUBLICO V5
        // ======================

        const ticker =
            await exchange.publicGetV5MarketTickers({
                category: 'spot',
                symbol
            });

        const price =
            parseFloat(
                ticker.result.list[0].lastPrice
            );

        // ======================
        // HISTORICO
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

            profit =
                price - position.entryPrice;

            const tp =
                calcTP(position.entryPrice);

            const sl =
                calcSL(position.entryPrice);

            // ======================
            // TAKE PROFIT
            // ======================

            if (price >= tp) {

                action = "SELL_TP";

                console.log("TAKE PROFIT");

                position = null;
            }

            // ======================
            // STOP LOSS
            // ======================

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

        console.log(
            "BOT ERROR:",
            err.message
        );
    }
}

// ======================
// START LOOP
// ======================

setInterval(bot, 2000);

console.log("AI BOT RUNNING");