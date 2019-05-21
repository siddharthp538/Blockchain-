const sha256 = require('sha256');
function Blockchain(){
    this.chain = [];
    this.newTransactions = [];
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
        recipient
    }
    this.newTransactions.push(newTransaction);
    return this.getLastBlock()['index']+1;
}

Blockchain.prototype.hashBlock = function(prevBlockHash, currentBlockData, nonce ){
    const data = prevHashBlock + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(data);
    return hash;
}

module.exports = Blockchain;