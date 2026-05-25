function aiDecision(prices) {

    if (!prices || prices.length < 5) {
        return "HOLD";
    }

    const last = prices.slice(-5);

    const first = last[0];
    const lastPrice = last[last.length - 1];

    // tendência
    const trend = (lastPrice - first) / first;

    // volatilidade
    let volatility = 0;

    for (let i = 1; i < last.length; i++) {
        volatility += Math.abs(last[i] - last[i - 1]);
    }

    volatility = volatility / last.length;

    console.log({
        trend,
        volatility
    });

    // =========================
    // IA MAIS FLEXÍVEL
    // =========================

    if (trend > 0.0001) {
        return "BUY";
    }

    if (trend < -0.0001) {
        return "SELL";
    }

    return "HOLD";
}

module.exports = { aiDecision };