function aiDecision(prices) {

    if (!prices || prices.length < 20) {
        return "HOLD";
    }

    const last = prices.slice(-20);

    const first = last[0];
    const lastPrice = last[last.length - 1];

    const trend = (lastPrice - first) / first;

    let volatility = 0;

    for (let i = 1; i < last.length; i++) {
        volatility += Math.abs(last[i] - last[i - 1]);
    }

    volatility = volatility / last.length;

    console.log({ trend, volatility });

    if (trend > 0.000005) return "BUY";
    if (trend < -0.000005) return "SELL";

    return "HOLD";
}

// 🔥 ISSO AQUI É O IMPORTANTE
module.exports = { aiDecision };