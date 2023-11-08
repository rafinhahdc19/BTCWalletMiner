const CoinKey = require("coinkey")
const axios = require("axios")
const fs = require("fs")
//bpp = balance, pvk(privateKey), pbk(publicKey)
function salvarBPP(bpp){
    fs.writeFile("./key.txt", JSON.stringify(bpp)  + '\n', (err) => {
        if(err) throw err
        console.log("A bpp foi salva")
    })
}

async function getNewWallet(){
    const wallet = new CoinKey.createRandom()
    const response = await axios.get("https://blockchain.info/balance?active="+wallet.publicAddress)
    return {"balance":response.data[wallet.publicAddress].final_balance,"pvk":wallet.privateKey.toString("hex"),"pbk":wallet.publicAddress}
}
async function main(){
    const wallet = await getNewWallet()
    console.log(wallet)
    if (wallet.balance > 0) {
        console.log("você encontrou btc, privateKey:"+wallet.pvk)
        await salvarBPP(wallet)
        process.exit(0)
    }else{
        main()
    }
}
main()