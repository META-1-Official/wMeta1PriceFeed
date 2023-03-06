require("dotenv").config();
require("reflect-metadata");
const {container} = require("tsyringe");
const PriceServer = require("./PriceServerVisionDex.js");
const { WITHDRAW_CONTRACT } =  require('./withdraw_contract.abi');
const Web3 = require("web3");


const web3  = new Web3(Web3.givenProvider || process.env.NODE_RPC_URL);
const withdrawContract =  new web3.eth.Contract(WITHDRAW_CONTRACT , process.env.WITHDRAW_CONTRACT);

(async function() {

    let the_interval = process.env.CONTRACT_PRICE_UPDATE_INTERVAL;
    let meta1usdtLatest;
    const round = (n, d) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);

        const priceContractUpdateScript = async () => {
            console.log("started");
            let quote = await container.resolve(PriceServer).latestPrice;
            console.log("Quote =>", quote);
            meta1usdtLatest = quote.latest;
            // this can be used as dynamic value to run script accordingly like from db
            const price = round( meta1usdtLatest * 1e8, 0);
            console.log("Price =>", price);
            await web3.eth.accounts.wallet.add(process.env.PRICE_USER_ROLE_PRIVATE_KEY);
            let gasLimit = await withdrawContract.methods.updateMetaPrice(price).estimateGas({
                from: web3.eth.accounts.wallet[0].address
            });
            let result = await withdrawContract.methods.updateMetaPrice(price).send(
                {
                    from: web3.eth.accounts.wallet[0].address,
                    gas: gasLimit
                }
            );
            console.log(result.transactionHash);
            console.log("ended");
        }
    // Start price server
    container.registerInstance(PriceServer, await PriceServer.init());
    await container.resolve(PriceServer).start();

    // Start Price Push
    setInterval(priceContractUpdateScript, the_interval);
})();



