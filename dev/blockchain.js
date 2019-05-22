const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
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
        recipient
    }
    this.newTransactions.push(newTransaction);
    return this.getLastBlock()['index']+1;
}

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
module.exports = Blockchain;