/*
 * 온습도 블록체인 데이터 구조 모듈
 */

const sha256 = require('sha256');
const ip = require('ip');

const currentNodeUrl = `http://${ip.address()}:${process.argv[2]}`;

// 온습도 블록체인 class
class Blockchain {
  // 온습도 블록체인 생성자
  constructor() {
    this.chain = []; // 채굴한 모든 블록들은 배열 안에 체인으로 저장
    this.pendingTransactions = []; // 블록에 아직 저장되지 않은 모든 트랜잭션들

    // 노드의 URL
    this.currentNodeUrl = currentNodeUrl;

    // Blockchain networks
    this.networkNodes = [];

    // 제네시스 블록
    this.pushBlock(this.createNewBlock(100, '0', '0'));
  }

  // 트랜잭션 초기화 메소드
  resetTransaction() {
    this.pendingTransactions = [];
  }

  // 블록 추가 메소드
  pushBlock(newBlock) {
    this.chain.push(newBlock);
  }

  // 새로운 블록 생성 메소드
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
    // this.chain.push(newBlock); // 새로운 블록을 체인에 추가
    return newBlock;
  }

  // 마지막 블록을 호출하는 메소드
  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  // 새로운 트래잭션을 생성하는 메소드
  createNewTransaction(temperature, humidity, date, room) {
    const newTransaction = {
      temperature: temperature,
      humidity: humidity,
      date: date,
      room: room,
    };

    /*
      새로운 트랜잭션이 생성될 때마다 pendingTransactions 추가됨
      그러나 배열 안의 모든 트랜잭션들은 확정된 것이 아님
      새로운 블록이 생성될 땜 블록체인에 기록됨 -> 아직은 미결 트랜잭션
    */
    return newTransaction;
  }

  // 트랜잭션 추가 메소드
  addTransactionToPendingTransactions(transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
  }

  // 해시 계산 메소드
  hashBlock(previousBlockHash, currentBlockData, nonce) {
    // currentBlockData는 JSON인데 stringify로 문자열로 변경
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
  }

  // 합의 알고리즘 메소드
  proofOfWork(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    // 계산된 해시 값의 앞 4글자가 0000이 되는 nonce를 찾는다.
    while (hash.substring(0, 4) !== '0000') {
      nonce++;
      hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
  }

  // 합의 알고리즘
  chainIsValid(blockchain) {
    let validChain = true;
    for (let i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i];
      const prevBlock = blockchain[i - 1];

      const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);

      // 이전 블록의 해시와 현재 블록의 이전 블록 해시를 비교한다.
      if (currentBlock['previousBlockHash'] !== prevBlock['hash']) {
        validChain = false;
      }

      // 해시값의 앞 4개가 0인지 확인한다.
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

    // 제네시스 블록을 검증한다.
    if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) {
      validChain = false;
    }

    return validChain;
  }

  // 온습도 블록을 반환한다.
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

  // ㅁㄴㅇ
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

  getRoomData(room) {
    let roomTransaction = [];

    this.chain.forEach((block) => {
      if (block.hash !== '0') {
        if (block.transactions[0].room === parseInt(room)) roomTransaction.push(block.transactions);
      }
    });

    return {
      roomTransaction: roomTransaction,
    };
  }

  getdateData(date) {
    let dateTransaction = [];

    this.chain.forEach((block) => {
      if (block.hash !== '0') {
        let tempDate = block.transactions[0].date.split(' ')[0];
        tempDate = tempDate.split('/').join('');

        if (tempDate === date) dateTransaction.push(block.transactions);
      }
    });

    return {
      dateTransaction: dateTransaction,
    };
  }
}

module.exports = Blockchain;
