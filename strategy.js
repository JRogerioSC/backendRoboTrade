const buyBelow = 76650;

function shouldBuy(price, position) {
    return !position && price < buyBelow;
}

module.exports = { shouldBuy, buyBelow };