const blockchain = require('./blockchain')
const bitcoin = new blockchain();
bitcoin.createNewBlock(234,'ASDGFG4HG567','5678IASGFDHGF');
bitcoin.createNewTransaction(80,'Siddharth','Pandey');
bitcoin.createNewBlock(127,'YUIO09876','74186DFGHJKL');

console.log(bitcoin)
