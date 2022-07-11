const express = require("express");
const {container} = require("tsyringe");
const PriceServer = require("./PriceServer");

class HttpServer {
    server;

    constructor() {
        this.server = express();
    }

    static async init() {
        const self = new HttpServer();
        self.bindRoutes();
        return self;
    }

    async start() {
        this.server.listen(process.env.HTTP_SERVER_PORT, () => {
            console.log(`HTTP Server started at port ${ process.env.HTTP_SERVER_PORT }`);
        })
    }

    bindRoutes() {
        this.server.get('/ticker', this.getTickerData);
    }

    getTickerData(req, res) {
        try {
            const data = container.resolve(PriceServer).latestPrice;
            return res.send(data);
        } catch (e) {
            res.status(400);
            return res.send(`data not found`);
        }
    }
}

module.exports = HttpServer;
