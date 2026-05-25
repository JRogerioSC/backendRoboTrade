function calcTP(entry) {
    return entry * 1.003;
}

function calcSL(entry) {
    return entry * 0.998;
}

module.exports = { calcTP, calcSL };