const CoinKey = require("coinkey")
const fs = require("fs").promises
const numWallets = 400
const { ECPairFactory } = require('ecpair');
const ecc = require('tiny-secp256k1');
const bitcoin = require('bitcoinjs-lib');
const ECPair = ECPairFactory(ecc)
const readline = require('node:readline');
const { stdin: input, stdout: output } = require('node:process');

const rl = readline.createInterface({ input, output });
rl.question("Clique qualquer tecla para iniciar o programa...",(answer) => {
    main(numWallets)
    rl.close();
});


//bpp = balance, pvk(privateKey), pbk(publicKey)
async function salvarBPP(bpp){
    const stringFromBpp = JSON.stringify(bpp)
    await fs.writeFile("./key.txt", stringFromBpp  + '\n', (err) => {
        if(err) console.log(err)
        console.log("A bpp foi salva")
    })
}

async function getNewWallet(numeroDeCarteiras){
    try{

    
    const carteiras = [];
    const pvk_pbk = []; 
    let metade
    if (numeroDeCarteiras % 2 === 0) {
        metade = numeroDeCarteiras / 2
    }else{
        metade = (numeroDeCarteiras - 1) / 2
    }
    for (let i = 1; i <= metade; i++) {
        const wallet = new CoinKey.createRandom();
        const pvk = wallet.privateKey.toString("hex");
        const keyPair = ECPair.fromPrivateKey(Buffer.from(
            pvk, 'hex')
        );
        const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
        const payment = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey});
        const bech32Address = payment.address;
        carteiras.push(bech32Address);
        carteiras.push(address);
        pvk_pbk.push({pvk, pbk:bech32Address});
        pvk_pbk.push({pvk, pbk:address})
    }
    const enderecosParaConsulta = carteiras.join(",");

    const response = await fetch(`https://blockchain.info/balance?active=${enderecosParaConsulta}`);
    const dados = await response.json();
        
    const walletsAndBalance = [];
    for (const endereco in dados) {
        const balance = dados[endereco].final_balance;
        const pvk_pbk_pair = pvk_pbk.find(pair => pair.pbk === endereco);
        if (pvk_pbk_pair) {
            const { pvk, pbk } = pvk_pbk_pair;
            walletsAndBalance.push({ balance, pvk, pbk });
        }
    }
    
    return walletsAndBalance;
}catch(err){
    console.log(err)
    main(numWallets)
}
}
async function main(numeroDeCarteiras){
    try{
        let encontrado = false; 
        const wallets = await getNewWallet(numeroDeCarteiras)
        //console.log(wallet)
        for (const wallet of wallets) {
            if (wallet.balance > 0) {
                console.log(`\x1b[32mBTC: ${wallet.balance} Address: ${wallet.pbk} PrivateKey: ${wallet.pvk}\x1b[0m`);
                encontrado = true
                console.log("Você encontrou BTC, privateKey:", wallet.pvk);
                await salvarBPP(wallet);
                process.exit()
            }else{
                console.log(`\x1b[31mBTC: ${wallet.balance} Address: ${wallet.pbk} PrivateKey: ${wallet.pvk}\x1b[0m`);
            }
        }
        if(encontrado == false){
            main(numWallets)
        }else{
            process.exit(0)
        }
    }catch(err){
        console.log(err)
        main(numWallets)
        return
    }
    
}
