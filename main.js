const Meta1 = require('meta1dex');
const request = require('request');
const dotenv = require("dotenv");

dotenv.config()

const m1apiNodeURL = 'wss://zeus.meta1.io/ws';

var minutes = 10, the_interval = minutes * 60 * 1000;

var meta1usdtLatest;

const round = (n, d) => Math.round(n * Math.pow(10,d)) / Math.pow(10,d);

async function pricePush() {
    console.log('Pushing META1 price to meta1.io ...');
    try {
        let quote = await getQuote('USDT', 'META1');
        meta1usdtLatest = round(quote.latest, 2);
        //console.log(meta1usdtLatest);
    }
    catch (err) {
        console.error('getting META1/USDT price', err);
        return;
    }
    
    var headers = {
        'X-ApiKey': process.env.APIKEY,
        'Content-Type': 'application/json'
    };
    
    var dataString = '{\'price\':\'' + meta1usdtLatest + '\'}';
    
    var options = {
        url: process.env.META1URL,
        method: 'POST',
        headers: headers,
        body: dataString,
        auth: {
            'user': process.env.USERNAME,
            'pass': process.env.PASSWORD
        }
    };
    
    console.log('Headers: ', headers);
    console.log('dataString: ', dataString);
    console.log('options: ', options);
    
    
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('Error: ', body);
        } else {
            console.log('Success. META1 price: ', meta1usdtLatest, 'Response: ', response, "Body: ", body);
        }
    }
    
    request(options, callback);
    
}

async function getQuote(baseSymbol, quoteSymbol) {
    try {
        await Meta1.connect(m1apiNodeURL);
        let ticker = await Meta1.ticker(baseSymbol, quoteSymbol);
        return ticker; 
    }
    catch(err) {
        console.error(err);
        throw err;
    }
    return undefined;
}

setInterval(pricePush, the_interval);
