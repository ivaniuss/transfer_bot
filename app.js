const express = require('express');
const bodyParser = require('body-parser');
const { Alchemy, Network, Wallet, Utils } = require('alchemy-sdk');
require('dotenv').config();

const {PRIVATE_KEY, ARB_API_KEY} = process.env
let wallet = new Wallet(PRIVATE_KEY);

const config = {
  apiKey: ARB_API_KEY,
  network: Network.ARB_MAINNET,
};
const alchemy = new Alchemy(config);

const toAddress = '0x7b1CF9d5ccf5f56142110deE0ABA00B790075cA6'; // rescue

const app = express()
app.use(bodyParser.json())
const port = 3000 || process.env.PORT

app.post('/webhook', async (req, res) => {
  try {
    const balance = await alchemy.core.getBalance(wallet.address, 'latest');
    const gasPrice = Utils.parseUnits("0.02", "gwei")
    const maxGas = 42000; 
    const gasCost = gasPrice.mul(maxGas); 
    const sendValue = balance.sub(gasCost); 
    if (sendValue.lt(0)) {
      throw new Error('Insufficient funds for transaction');
    }

    const transaction = {
      to: toAddress,
      value: sendValue,
      gasLimit: String(maxGas),
      maxPriorityFeePerGas: gasPrice,
      maxFeePerGas: gasPrice,
      nonce: await alchemy.core.getTransactionCount(wallet.address, "latest"),
      type: 2,
      chainId: 42161,
    };

    const rawTransaction = await wallet.signTransaction(transaction);
    const tx = await alchemy.core.sendTransaction(rawTransaction);

    console.log("Transacción enviada:", tx);
    res.status(200).json({ message: 'success transaction', transaction: tx });
  } catch (error) {
    console.error("Error al enviar la transacción:", error);
    res.status(500).json({ error: 'Error when making transaction', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})