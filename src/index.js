const CoinKey = require("coinkey")
const axios = require("axios")
const fs = require("fs").promises
const numWallets = 30
//bpp = balance, pvk(privateKey), pbk(publicKey)
async function salvarBPP(bpp){
    const stringFromBpp = JSON.stringify(bpp)
    await fs.writeFile("./key.txt", stringFromBpp  + '\n', (err) => {
        if(err) console.log(err)
        console.log("A bpp foi salva")
    })
}

async function getNewWallet(numeroDeCarteiras){
    const carteiras = [];
    const pvk_pbk = []; 
    
    for (let i = 1; i <= numeroDeCarteiras; i++) {
        const wallet = new CoinKey.createRandom();
        const pvk = wallet.privateKey.toString("hex");
        const pbk = wallet.publicAddress;
        
        carteiras.push(pbk);
        pvk_pbk.push({ pvk, pbk });
    }
    
    const enderecosParaConsulta = carteiras.join(",");
    
    const response = await axios.get("https://blockchain.info/balance?active=" + enderecosParaConsulta);
    const dados = response.data;
    
    const walletsAndBalance = [];
    
    for (const endereco in dados) {
        const balance = dados[endereco].final_balance;
        const pvk_pbk_pair = pvk_pbk.find(pair => pair.pbk === endereco);
        
        if (pvk_pbk_pair) {
            const { pvk, pbk } = pvk_pbk_pair;
            walletsAndBalance.push({ balance : balance, pvk, pbk });
        }
    }
    
    console.log(walletsAndBalance);
    return walletsAndBalance;
}
async function main(numeroDeCarteiras){
    let encontrado = false; 
    const wallets = await getNewWallet(numeroDeCarteiras)
    //console.log(wallet)
    for (const wallet of wallets) {
        console.log(wallet.balance)
        if (wallet.balance > 0) {
            encontrado = true
            console.log("Você encontrou BTC, privateKey:", wallet.pvk);
            await salvarBPP(wallet);
            process.exit()
        }
    }
    if(encontrado == false){
        main(numWallets)
    }else{
        process.exit(0)
    }
}

main(numWallets)