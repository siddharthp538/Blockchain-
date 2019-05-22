const express = require('express');
const app = express();
const uuid = require('uuid/v1');
const Blockchain = require('./blockchain');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

const bitcoin = new Blockchain();
const nodeAddress = uuid().split('-').join('');

app.get('/blockchain', (req,res) => {
    res.send(bitcoin);
});
app.post('/transaction', (req,res)=>{
    const blockIndex = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    
    res.send(`transaction added to block ${blockIndex}`);
});
app.get('/mine' , (req,res)=>{
    const lastBlock = bitcoin.getLastBlock()
    const prevHash = lastBlock['hash'];
    const currentBlock = {
        transactions : bitcoin.newTransactions,
        index : lastBlock['index']
    };
    const nonce = bitcoin.proofOfWork(prevHash, currentBlock);
    const currentHash  = bitcoin.hashBlock(prevHash, currentBlock, nonce);
    bitcoin.createNewTransaction(12.5,"00",nodeAddress);
    const newBlock = bitcoin.createNewBlock(nonce, prevHash, currentHash);
    res.send({
        'message':'new block mined successfully!',
        block: newBlock
    }); 
});

app.listen(3000,()=>{
    console.log('Listening on port 3000...');
});