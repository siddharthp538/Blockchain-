const express = require('express');
const app = express();
const uuid = require('uuid/v1');
const Blockchain = require('./blockchain');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
const port = process.argv[2];
const bitcoin = new Blockchain();
const nodeAddress = uuid().split('-').join('');
const currentUrl = process.argv[3];
const rp = require('request-promise');

app.get('/blockchain', (req,res) => {
    res.send(bitcoin);
});
app.post('/transac  tion', (req,res)=>{
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

app.post('/register-and-broadcast-node', (req,res) => {
    const newNodeUrl = req.body.newNodeUrl;
    if( bitcoin.networkNodes.indexOf(newNodeUrl) == -1)
        bitcoin.networkNodes.push(newNodeUrl);
    let regNodePromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri : networkNodeUrl + '/register-node',
            method : 'POST',
            body : {newNodeUrl : newNodeUrl},
            json: true
        };
        regNodePromises.push(rp(requestOptions)); 
    });
    Promise.all(regNodePromises)
    .then(data => {
        const bulkRegisterOptions = {
            uri : newNodeUrl + '/register-nodes-bulk',
            method : 'POST',
            body : {allNetworkNodes : [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
            json: true 
        };
        return rp(bulkRegisterOptions);
    })
    .then(data => {
        res.json({note:'New Node registered successfully!'});
    });
});

app.post('/register-node', (req,res)=>{
    const newNodeUrl = req.body.newNodeUrl;
    if(bitcoin.networkNodes.indexOf(newNodeUrl)==-1 && bitcoin.currentNodeUrl !== newNodeUrl){
        console.log('newnodeurl: ' + newNodeUrl);
        bitcoin.networkNodes.push(newNodeUrl);
        console.log('here!');
        res.send({note: 'New node registered successfully!'});
    }
    else{
        res.send({note: 'could not send!'});
    }
    
});

app.post('/register-nodes-bulk', (req,res)=>{
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(newNodeUrl => {
        if(bitcoin.networkNodes.indexOf(newNodeUrl)==-1 && bitcoin.currentNodeUrl !== newNodeUrl){
            bitcoin.networkNodes.push(newNodeUrl);
        }
    });
    res.send({note:'Bulk registration successfull!'});
    
});


app.listen(port,()=>{
    console.log(`Listening on port ${port}...`);
});