require('dotenv').config();

const ccxt = require('ccxt');

const { aiDecision } = require('./ai');
const { calcTP, calcSL } = require('./risk');
const { broadcast } = require('./ws');

// ======================
// BYBIT
// ======================

const exchange = new ccxt.bybit({
    apiKey: process.env.API_KEY,
    secret: process.env.API_SECRET,

    enableRateLimit: true,

    options: {
        defaultType: 'spot',
    },

    testnet: true,
});

const symbol = 'BTC/USDT';

let position = null;
let prices = [];

let marketsLoaded = false;
let minAmount = 0.001;

// 🔥 TRAVA DE EXECUÇÃO (evita spam de ordem)
let isProcessing = false;

// ======================
// BOT
// ======================

async function bot() {

    if (isProcessing) return; // evita duplicação

    isProcessing = true;

    try {

        if (!marketsLoaded) {
            const markets = await exchange.loadMarkets();
            minAmount = markets[symbol]?.limits?.amount?.min || 0.001;
            marketsLoaded = true;
        }

        const ticker = await exchange.fetchTicker(symbol);
        const price = ticker.last + (Math.random() * 2 - 1);
        prices.push(price);
        if (prices.length > 50) prices.shift();

        const decision = aiDecision(prices);

        let action = "WAITING";
        let profit = 0;

        // ======================
        // BUY (AUTO)
        // ======================

        if (!position && decision === "BUY") {

            const ticker = await exchange.fetchTicker(symbol);
            const price = ticker.last;

            // mínimo em USDT (valor da ordem)
            const minUSDT = 10; // normalmente 5 ou 10 na Bybit spot

            let amount = minUSDT / price;

            // ajuste para evitar erro de precisão
            amount = parseFloat(amount.toFixed(6));

            await exchange.createMarketBuyOrder(symbol, amount);

            position = {
                entryPrice: price,
                amount
            };

            action = "BUY";
            console.log("BUY", price, amount);
        }

        // ======================
        // POSITION MANAGEMENT
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

                console.log("TAKE PROFIT EXECUTED");
            }

            // STOP LOSS
            else if (price <= sl) {

                await exchange.createMarketSellOrder(symbol, position.amount);

                action = "SELL_SL";
                position = null;

                console.log("STOP LOSS EXECUTED");
            }
        }

        broadcast({
            price,
            action,
            position,
            profit,
            decision
        });

        console.log({ price, action, position, profit });

    } catch (err) {
        console.log("BOT ERROR:", err.message);
    }

    isProcessing = false;
}

// ======================
// LOOP (AUTO TRADING)
// ======================

setInterval(bot, 500);

console.log("BYBIT BOT RUNNING");