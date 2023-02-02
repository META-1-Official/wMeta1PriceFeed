This project is used to push META1 price to meta1coin.vision website.

To install run: npm install

Copy .env.template to .env file and fill in the credentials.

To run in screen:
`screen -dmSL pricePush node main.js`

## HttpServer
This package includes a small express HTTP Server.

### Routes
* `/ticker` responds with USDT-META1 symbol latest ticker data

## WS Server
this package includes a small WS server which broadcasts 
the latest USDT-META1 symbol ticker data to all connected clients, 
broadcast interval can be configured using `PRICE_BROADCAST_INTERVAL` env variable
