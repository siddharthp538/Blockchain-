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
    this.transactions=[];
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
    return newTransaction;
}

module.exports = Blockchain;