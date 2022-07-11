const { WebSocket, WebSocketServer } = require("ws");
const {container} = require("tsyringe");
const PriceServer = require("./PriceServer");

class WsServer {
    server;
    interval;

    constructor() {
        this.server = new WebSocketServer({ port: parseInt(process.env.WSS_SERVER_PORT) });
        console.log(`WS Server started at port ${ process.env.WSS_SERVER_PORT }`)
    }

    static async init() {
        return new WsServer();
    }

    async broadCastLatestPrice() {
        container.resolve(WsServer).server.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(container.resolve(PriceServer).latestPrice));
            }
        });
    }

    async start() {
        this.server.on('connection', function connection(ws) {
            // for each new connection, push the latest price immediately
            ws.send(JSON.stringify(container.resolve(PriceServer).latestPrice));
        });

        // Then start interval to broadcast prices on a set interval to all connected clients
        this.interval = setInterval(this.broadCastLatestPrice, process.env.PRICE_BROADCAST_INTERVAL);
    }

    async stop() {
        if (typeof this.interval !== "undefined" && this.interval !== null) {
            clearInterval(this.interval);
        }
    }
}

module.exports = WsServer;
