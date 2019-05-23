const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid/v1');

function Blockchain(){
    this.chain = [];
    this.newTransactions = [];
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    this.createNewBlock(100, '0', '0');
 
}

Blockchain.prototype.createNewBlock = function(nonce, prevHashBlock, hash){
    const newBlock = {
        index: this.chain.length+1,
        timestamp: Date.now(),
        nonce: nonce,
        hash: hash,
        prevHashBlock: prevHashBlock,
        transactions: this.newTransactions
    }
    this.newTransactions=[];
    this.chain.push(newBlock);
    return newBlock;
}

Blockchain.prototype.getLastBlock = function(){
    return this.chain[this.chain.length-1];
}

Blockchain.prototype.createNewTransaction = function(amount,sender,recipient) {
    const newTransaction = {
        amount,
        sender,
        recipient,
        transactionId: uuid().split('-').join('')
    };
    return newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
    this.newTransactions.push(transactionObj);
    return this.getLastBlock()['index']+1;
};

Blockchain.prototype.hashBlock = function(prevBlockHash, currentBlockData, nonce ){
    const data = prevBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(data);
    return hash;
}

Blockchain.prototype.proofOfWork = function(prevBlockHash,  currentBlockData){
    let nonce = 1;
    let hash = this.hashBlock(prevBlockHash, currentBlockData, nonce);
    while(hash.substring(0,4) !== '0000'){
        nonce++;
        hash = this.hashBlock(prevBlockHash,currentBlockData,nonce);
    }
    return nonce;

}

Blockchain.prototype.chainIsValid = function(blockchain) {
	let validChain = true;

	for (var i = 1; i < blockchain.length; i++) {
		const currentBlock = blockchain[i];
		const prevBlock = blockchain[i - 1];
		const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
		if (blockHash.substring(0, 4) !== '0000') validChain = false;
		if (currentBlock['prevHashBlock'] !== prevBlock['hash']) validChain = false;
	};

	const genesisBlock = blockchain[0];
	const correctNonce = genesisBlock['nonce'] === 100;
	const correctPreviousBlockHash = genesisBlock['prevHashBlock'] === '0';
	const correctHash = genesisBlock['hash'] === '0';
	const correctTransactions = genesisBlock['transactions'].length === 0;
    console.log("correct nonce: " + correctNonce);
    console.log("correct prev block hash: "  + correctPreviousBlockHash);
    console.log("correct hash: " + correctHash);
    console.log("correct transactions: " + correctTransactions);

	if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) validChain = false;

	return validChain;
};

Blockchain.prototype.getBlock = function(blockHash){
    let correctblock = null;
    this.chain.forEach(block => {
        if(block.hash === blockHash) correctblock = block; 
    });
    return correctblock;

}

Blockchain.prototype.getTransaction = function(transactionId) {
    let currTransactions = null;
    let currBlock = null;
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.transactionId === transactionId){
                currTransactions = transaction;
                currBlock = block;
            }
        });
    });
    return {
        transaction : currTransactions,
        block : currBlock
    }
}

Blockchain.prototype.getAddressData = function(address) {
    const addressTransaction = [];
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.sender === address || transaction.recipient === address){
                addressTransaction.push(transaction);
            }
        });
    });
    let balance=0;
    addressTransaction.forEach(tr => {
        if(tr.sender === address) balance -= tr.amount;
        else if(tr.recipient === address) balance += tr.amount;
    });
    return {
        addressTransaction : addressTransaction,
        addressBalance : balance
    }
}
module.exports = Blockchain;