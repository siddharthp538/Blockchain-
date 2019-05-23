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
app.post('/transaction', (req,res)=>{
    const newTransaction = req.body;
    const idx = bitcoin.addTransactionToPendingTransactions(newTransaction);    
    res.json({'note' : `Transaction will be added in ${idx}`});
});

app.post('/transaction/broadcast', (req,res)=>{
    const newTransaction = bitcoin.createNewTransaction(req.body.amount,req.body.sender,req.body.recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);
    const reqPromises = []; 
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        }
        reqPromises.push(rp(requestOptions));
    });
    Promise.all(reqPromises)
    .then(data => {
        res.send({note:'Broadcast completed!'});
    });
});

app.post('/receive-new-block', (req,res)=>{
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.prevHashBlock;
    const correctIndex = lastBlock.index+1 === newBlock.index;
    if(correctHash && correctIndex){
        bitcoin.chain.push(newBlock);
        bitcoin.newTransactions = []; 
        res.json({note:'new block accepted!'});
    }
    else{
        res.json({note:"block was rejected!"});
    }
});

app.get('/mine' , (req,res)=>{
    const lastBlock = bitcoin.getLastBlock()
    const prevHash = lastBlock['hash'];
    const currentBlock = {
        transactions : bitcoin.newTransactions,
        index : lastBlock['index']+1
    };
    const nonce = bitcoin.proofOfWork(prevHash, currentBlock);
    const currentHash  = bitcoin.hashBlock(prevHash, currentBlock, nonce);
    const newBlock = bitcoin.createNewBlock(nonce, prevHash, currentHash);
    const reqPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl+'/receive-new-block',
            json: true,
            body : {newBlock:newBlock},
            method : 'POST'
        };
        reqPromises.push(rp(requestOptions));


    });
    Promise.all(reqPromises)
    .then(data => {
        const requestOptions = {
            uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
            method:'POST',
            json: true,
            body : {
                amount: 12.5,
                sender: '00',
                recipient: nodeAddress
            }
        }
        return rp(requestOptions);
    })
    .then(data => {
        res.send({
            'message':'new block mined successfully!',
            block: newBlock
        }); 
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
        bitcoin.networkNodes.push(newNodeUrl);
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

app.get('/consensus', function(req, res) {
	const requestPromises = [];
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/blockchain',
			method: 'GET',
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});
    console.log('array size: '+requestPromises.length);
	Promise.all(requestPromises)
	.then(blockchains => {
		const currentChainLength = bitcoin.chain.length;
		let maxChainLength = currentChainLength;
		let newLongestChain = null;
		let newPendingTransactions = null;

		blockchains.forEach(blockchain => {
			if (blockchain.chain.length > maxChainLength) {
				maxChainLength = blockchain.chain.length;
				newLongestChain = blockchain.chain;
				newPendingTransactions = blockchain.newTransactions;
			};
		});

        let value = bitcoin.chainIsValid(newLongestChain)
        console.log('value: '+ value);
		if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))) {
			res.json({
				note: 'Current chain has not been replaced.',
				chain: bitcoin.chain
			});
		}
		else {  
			bitcoin.chain = newLongestChain;
			bitcoin.newTransactions = newPendingTransactions;
			res.json({
				note: 'This chain has been replaced.',
				chain: bitcoin.chain
			});
		}
	});
});



app.listen(port,()=>{
    console.log(`Listening on port ${port}...`);
});