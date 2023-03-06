require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
/***** HSM params *****/
const hsmUrl = process.env.HSM_URL;
const hsmAlgo = process.env.HSM_ALGO;
const hsmLength = parseInt(process.env.HSM_LENGTH);
/***** HSM params *****/

const generateKey = async (label) => {
    console.log('1. CreateToken');
    const keyId = uuidv4();
    const req = { body: {} };

    req.body.requestId = '1.0';
    req.body.version = '1.0';
    req.body.clientId = 'client-1';
    req.body.keyId = keyId;
    req.body.algo = hsmAlgo;
    req.body.param = hsmLength;
    req.body.label = label;
    req.body.type = 'CreateToken';
    console.log('CreateToken request: ', req.body);

    const createToken = await axios.post(hsmUrl, req.body).then(function (response) {
        console.log('CreateToken response: ', response.data);
        return response.data;
    });

    console.log('2. GenerateKeyPair');
    const tokenSerial = JSON.parse(createToken.response).tokenSerial;
    req.body.tokenSerial = tokenSerial;
    req.body.signature = createToken.signature;
    req.body.type = 'GenerateKeyPair';
    console.log('GenerateKeyPair request: ', req.body);
    const generateKeyPair = await axios.post(hsmUrl, req.body).then(function (response) {
        console.log('GenerateKeyPair response: ', response.data);
        return response.data;
    });
    const res = JSON.parse(generateKeyPair.response);
    const publicKey = Buffer.from(res.publicKey, 'base64').toString('hex');

    console.table({
        label,
        tokenSerial,
        keyId,
        publicKey,
    });
    return {
        label,
        tokenSerial,
        keyId,
        publicKey,
    };
};

const encrypt = async (tokenSerial, keyId, data) => {
    const req = { body: {} };

    req.body.requestId = '1.0';
    req.body.version = '1.0';
    req.body.type = 'Encrypt';
    req.body.keyId = keyId;
    req.body.algo = hsmAlgo;
    req.body.data = Buffer.from(data).toString('base64');
    req.body.tokenSerial = tokenSerial;
    console.log('Encrypt request: ', req.body);

    const encrypt = await axios.post(hsmUrl, req.body).then(function (response) {
        // console.log('Encrypt response: ', response.data);
        return JSON.parse(response.data.response);
    });

    console.log(`Encrypted Value: ${encrypt.responseData}`);
    return encrypt.responseData;
};

const decrypt = async (tokenSerial, keyId, encryptedData) => {
    const req = { body: {} };

    req.body.requestId = '1.0';
    req.body.version = '1.0';
    req.body.type = 'Decrypt';
    req.body.tokenSerial = tokenSerial;
    req.body.keyId = keyId;
    req.body.algo = hsmAlgo;
    req.body.data = encryptedData;
    console.log('Decrypt request: ', req.body);

    const decrypt = await axios.post(hsmUrl, req.body).then(function (response) {
        // console.log('Decrypt response: ', response.data);
        return JSON.parse(response.data.response);
    });

    // console.log(`Decrypted Value: ${Buffer.from(decrypt.responseData, 'base64').toString()}`);
    return Buffer.from(decrypt.responseData, 'base64').toString();
};

const createTokenGenerateKeyAndEncrypt = async (label, data) => {
    const keyId = uuidv4();
    const req = { body: {} };

    req.body.requestId = '1.0';
    req.body.version = '1.0';
    req.body.type = 'CreateTokenGenerateKeyAndEncrypt';

    req.body.label = label;
    req.body.keyId = keyId;
    req.body.algo = hsmAlgo;
    req.body.param = hsmLength;
    req.body.data = Buffer.from(data).toString('base64');

    const createTokenGenerateKeyAndEncrypt = await axios.post(hsmUrl, req.body).then(function (response) {
        // console.log('CreateTokenGenerateKeyAndEncrypt response: ', response.data);
        return JSON.parse(response.data.response);
    });

    return {
        tokenSerial: createTokenGenerateKeyAndEncrypt.tokenSerial,
        cipherText: createTokenGenerateKeyAndEncrypt.responseData,
        keyId: keyId,
    };
};

const generateKeyAndEncrypt = async (tokenSerial, data) => {
    const keyId = uuidv4();
    const req = { body: {} };

    req.body.requestId = '1.0';
    req.body.version = '1.0';
    req.body.type = 'GenerateKeyAndEncrypt';

    req.body.tokenSerial = tokenSerial;
    req.body.keyId = keyId;
    req.body.algo = hsmAlgo;
    req.body.param = hsmLength;
    req.body.data = Buffer.from(data).toString('base64');

    const generateKeyAndEncrypt = await axios.post(hsmUrl, req.body).then(function (response) {
        // console.log('GenerateKeyAndEncrypt response: ', response.data);
        return JSON.parse(response.data.response);
    });

    return {
        cipherText: generateKeyAndEncrypt.responseData,
        keyId: keyId,
    };
};

// const throwError = (msg) => {
//   console.log('node modules/hsm.js <operation>[generate-key|encrypt] [...operation-params]\n');
//   console.log('Examples:\n');
//   console.log('node modules/hsm.js generate-key tokenLabel\n');
//   console.log('node modules/hsm.js encrypt tokenSerial keyId data\n');
//   console.log('node modules/hsm.js decrypt tokenSerial keyId encrypted-data\n');
//   throw new Error(msg);
// };

// (async function () {
//   const args = process.argv;
//   if (args.length < 3) throwError('Operation is required!');

//   if (args[2] === 'generate-key') {
//     if (args.length < 4) throwError('Label is required to generate key');
//     await generateKey(args[3]);
//   } else if (args[2] === 'encrypt') {
//     if (args.length < 6) throwError('tokenSerial, keyId and data is required to encrypt');
//     await encrypt(args[3], args[4], Buffer.from(args[5]).toString('base64'));
//   } else if (args[2] === 'decrypt') {
//     if (args.length < 6) throwError('tokenSerial, keyId and data is required to decrypt');
//     await decrypt(args[3], args[4], args[5]);
//   } else throwError('Invalid operation');
// })();

exports.generateKey = generateKey;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.createTokenGenerateKeyAndEncrypt = createTokenGenerateKeyAndEncrypt;
exports.generateKeyAndEncrypt = generateKeyAndEncrypt;
