const sha256 = require('sha256');
const { v1 } = require('uuid');

const currentNodeUrl = process.argv[3];

class Blockchain {
  constructor() {
    this.chain = []; // 채굴한 모든 블록들은 배열 안에 체인으로 저장
    this.pendingTransactions = []; // 블록에 아직 저장되지 않은 모든 트랜잭션들

    // 노드의 URL
    this.currentNodeUrl = currentNodeUrl;

    // Blockchain networks
    this.networkNodes = [];

    // 제네시스 블록
    this.createNewBlock(100, '0', '0');
  }

  // 새로운 블록을 생성하는 메소드
  createNewBlock(nonce, previousBlockHash, hash) {
    /*
     * index: 블록 넘버
     * timestapm: 블록이 생성한 날짜
     * transactions: 트랜잭션
     * nonce: proof of work로 새로운 블록을 만들었다는 증거
     * hash: newBlock에서 온 값
     * previousBlockHash: 이전 블록의 해시 값
     */
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      nonce: nonce,
      hash: hash,
      previousBlockHash: previousBlockHash,
    };

    this.pendingTransactions = []; // BlockChain 초기화
    this.chain.push(newBlock); // 새로운 블록을 체인에 추가
    return newBlock;
  }

  // 마지막 블록을 호출하는 메소드
  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  // 새로운 트래잭션을 생성하는 메소드
  createNewTransaction(temperature, humidity) {
    const newTransaction = {
      temperature: temperature,
      humidity: humidity,
    };

    /*
      새로운 트랜잭션이 생성될 때마다 pendingTransactions 추가됨
      그러나 배열 안의 모든 트랜잭션들은 확정된 것이 아님
      새로운 블록이 생성될 땜 블록체인에 기록됨 -> 아직은 미결 트랜잭션
    */
    return newTransaction;
  }

  addTransactionToPendingTransactions(transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
  }

  hashBlock(previousBlockHash, currentBlockData, nonce) {
    // currentBlockData는 JSON인데 stringify로 문자열로 변경
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
  }

  proofOfWork(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000') {
      nonce++;
      hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
  }

  // 합의 알고리즘
  // 마지막 노드 해시 검사 하지 않음, 추가 예정
  chainIsValid(blockchain) {
    let validChain = true;
    for (let i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i];
      const prevBlock = blockchain[i - 1];

      const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);

      if (currentBlock['previousBlockHash'] !== prevBlock['hash']) {
        validChain = false;
      }
      if (blockHash.substring(0, 4) !== '0000') {
        validChain = false;
      }

      console.log(`previousBlockHash => ${prevBlock['hash']}`);
      console.log(`currentBlockHash => ${currentBlock['hash']}`);
    }

    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) {
      validChain = false;
    }

    return validChain;
  }

  // 블록탐색기 메소드
  getBlock(blockHash) {
    let correctBlock = null;
    this.chain.forEach((block) => {
      if (blockHash === block.hash) {
        correctBlock = block;
      }
    });

    return correctBlock;
  }

  getTransaction(transactionId) {
    let correctBlock = null;
    let correctTransaction = null;

    this.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        if (transaction.transactionId === transactionId) {
          correctTransaction = transaction;
          correctBlock = block;
        }
      });
    });

    return {
      transaction: correctTransaction,
      block: correctBlock,
    };
  }

  getAddressData(address) {
    const addressTransactions = [];
    this.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        if (transaction.sender === address || transaction.recipient === address) {
          addressTransactions.push(transaction);
        }
      });
    });

    let balance = 0;
    addressTransactions.forEach((transaction) => {
      if (transaction.recipient === address) balance += transaction.amount;
      else if (transaction.sender === address) balance -= transaction.amount;
    });

    return {
      addressTransactions: addressTransactions,
      addressBalance: balance,
    };
  }
}

module.exports = Blockchain;
