require("dotenv").config();
require("reflect-metadata");

const request = require("request");

const {container} = require("tsyringe");

const PriceServer = require("./PriceServer.js");
const HttpServer = require("./HttpServer");
const WsServer = require("./WsServer");

(async function() {
    const minutes = 10, the_interval = minutes * 60 * 1000;
    let meta1usdtLatest;

    const round = (n, d) => Math.round(n * Math.pow(10,d)) / Math.pow(10,d);

    async function pricePush() {
        console.log('Pushing META1 price to meta1.io ...');
        try {
            let quote = await container.resolve(PriceServer).latestPrice;
            meta1usdtLatest = round(quote.latest, 2);
            //console.log(meta1usdtLatest);
        }
        catch (err) {
            console.error('getting META1/USDT price', err);
            return;
        }

        const headers = {
            'X-ApiKey': process.env.APIKEY,
            'Content-Type': 'application/json'
        };

        const dataString = '{\'price\':\'' + meta1usdtLatest + '\'}';

        const options = {
            url: process.env.META1URL,
            method: 'POST',
            headers: headers,
            body: dataString,
            auth: {
                'user': process.env.USERNAME,
                'pass': process.env.PASSWORD
            }
        };

        //console.log('Headers: ', headers);
        //console.log('dataString: ', dataString);
        //console.log('options: ', options);

        function callback(error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log('Error: ', body);
            } else {
                console.log('Success. META1 price: ', meta1usdtLatest);
            }
        }

        request(options, callback);

    }

    // Start price server
    container.registerInstance(PriceServer, await PriceServer.init());
    await container.resolve(PriceServer).start();

    // Start HttpServer
    container.registerInstance(HttpServer, await HttpServer.init());
    await container.resolve(HttpServer).start();

    // Start WS Server
    container.registerInstance(WsServer, await WsServer.init());
    await container.resolve(WsServer).start();

    // Start Price Push
    setInterval(pricePush, the_interval);
})();
