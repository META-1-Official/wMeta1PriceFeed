const Meta1 = require("meta1dex");
const {container} = require("tsyringe");

class PriceServer {
    static m1apiNodeURL = 'wss://celaeno.meta-exchange.vision/ws';
    static baseCurrency = "USDT";
    static quoteCurrency = "META1";

    latestPrice = null;
    interval = null;

    async updatePrice() {
        try {
            await Meta1.connect(PriceServer.m1apiNodeURL);
            container.resolve(PriceServer).latestPrice = await Meta1.ticker(PriceServer.baseCurrency, PriceServer.quoteCurrency);
            // console.log(`Latest price fetched for ${PriceServer.baseCurrency}-${PriceServer.quoteCurrency} pair`)
        }
        catch(err) {
            console.error(err);
            throw err;
        }
    }

    async stop() {
        if (typeof this.interval !== "undefined" && this.interval !== null) {
            clearInterval(this.interval);
        }
    }

    static async init() {
        return new PriceServer();
    }

    async start() {
        // Update price for the first time quickly
        await this.updatePrice();

        // then set interval to update price periodically
        this.interval = setInterval(await this.updatePrice, parseInt(process.env.PRICE_UPDATE_INTERVAL));

        return this;
    }
}


module.exports = PriceServer
