const express = require('express');
const app = express();

const { DHT22 } = require(__dirname + '/DHT22.js');
const dht22 = new DHT22();

const rp = require('request-promise');
const bodyParser = require('body-parser');
const request = require('request');
const ip = require('ip');

const Blockchain = require(__dirname + '/blockchain');
const bitcoin = new Blockchain();

const port = process.argv[2];

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.get('/blockchain', (req, res) => {
  res.send(bitcoin);
});

app.post('/transaction', async (req, res) => {
  const data = await dht22.get();
  // console.log(data);

  const newTransaction = bitcoin.createNewTransaction(data.temperature, data.humidity, data.date, data.room);
  bitcoin.addTransactionToPendingTransactions(newTransaction);

  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];

  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock['index'] + 1,
  };

  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

  const requestPromises = [];
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/receive-new-block',
      method: 'POST',
      body: { newBlock: newBlock },
      json: true,
    };

    requestPromises.push(rp(requestOptions));
  });

  let flag = true;

  Promise.all(requestPromises).then((data) => {
    bitcoin.pushBlock(newBlock);

    res.json({
      note: 'New block mined & broadcast successfully',
      block: newBlock,
    });

    request.get(`http://${ip.address()}:${port}/consensus`, function (error, response, body) {});
  });
});

// 분산을 위한 엔트포인트
app.post('/register-and-broadcast-node', (req, res) => {
  // 노드를 등록하고, 해당 노드를 전체 네트워크에 브로드캐스트
  const newNodeUrl = req.body.newNodeUrl;

  if (bitcoin.networkNodes.indexOf(newNodeUrl) === -1 && bitcoin.currentNodeUrl !== newNodeUrl) {
    bitcoin.networkNodes.push(newNodeUrl);
  }

  const regNodesPromises = [];
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/register-node',
      method: 'POST',
      body: {
        newNodeUrl: newNodeUrl,
      },
      json: true,
    };
    regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises)
    .then((data) => {
      const bulkRegisterOptions = {
        uri: newNodeUrl + '/register-nodes-bulk',
        method: 'POST',
        body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl] },
        json: true,
      };

      return rp(bulkRegisterOptions);
    })
    .then((data) => {
      res.json({
        note: 'New Node registered with network successfully.',
      });
    });
});

app.post('/register-node', (req, res) => {
  // 네트워크에 노드를 등록
  const newNodeUrl = req.body.newNodeUrl;

  const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) === -1;
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;

  if (nodeNotAlreadyPresent && notCurrentNode) {
    bitcoin.networkNodes.push(newNodeUrl);
  }

  res.json({
    note: 'New Node registered successfully.',
  });
});

app.post('/register-nodes-bulk', (req, res) => {
  // 한번에 여러 노드를 등록
  const allNetworkNodes = req.body.allNetworkNodes;

  allNetworkNodes.forEach((networkNodeUrl) => {
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) === -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;

    if (nodeNotAlreadyPresent && notCurrentNode) {
      bitcoin.networkNodes.push(networkNodeUrl);
    }
  });

  res.json({
    note: 'Bulk registration successful.',
  });
});

app.post('/receive-new-block', (req, res) => {
  const newBlock = req.body.newBlock;
  const lastBlock = bitcoin.getLastBlock(); // newBlock의 previousHash와 lastBlock의 hash 비교

  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  // const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
  const correctIndex = true;

  if (correctHash && correctIndex) {
    bitcoin.chain.push(newBlock);
    bitcoin.pendingTransactions = [];

    request.get(`http://${ip.address()}:${port}/consensus`, function (error, response, body) {});

    res.json({
      note: 'New block received and accepted.',
      newBlock: newBlock,
    });
  } else {
    request.get(`http://${ip.address()}:${port}/consensus`, function (error, response, body) {});

    res.json({
      note: 'New block rejected',
      newBlock: newBlock,
    });
  }
});

// 합의 알고리즘 엔드포인트
// 이미 동작중인 블록체인 네트워크에서 가장 신뢰할 수 있는 블록체인을 받아옴
app.get('/consensus', (req, res) => {
  const requestPromises = [];
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOption = {
      uri: networkNodeUrl + '/blockchain',
      method: 'GET',
      json: true,
    };
    requestPromises.push(rp(requestOption));
  });

  Promise.all(requestPromises).then((blockchains) => {
    const currentChainLength = bitcoin.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;

    blockchains.forEach((blockchain) => {
      if (blockchain.chain.length > maxChainLength) {
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTransactions = blockchain.pendingTransactions;
      }
    });

    if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))) {
      res.json({
        note: 'Current chain has not been replaced.',
        chain: bitcoin.chain,
      });
    } else {
      bitcoin.chain = newLongestChain;
      bitcoin.pendingTransactions = newPendingTransactions;

      res.json({
        note: 'This chain has been replaced.',
        chain: bitcoin.chain,
      });
    }
  });
});

// 블록 탐색기 엔드포인트
app.get('/block/:blockHash', (req, res) => {
  const blockHash = req.params.blockHash;
  console.log(blockHash);
  const correctBlock = bitcoin.getBlock(blockHash);

  res.json({
    block: correctBlock,
  });
});

app.get('/transaction/:transactionId', (req, res) => {
  const transactionId = req.params.transactionId;
  const transactionData = bitcoin.getTransaction(transactionId);

  res.json({
    transaction: transactionData.transaction,
    block: transactionData.block,
  });
});

app.get('/address/:address', function (req, res) {
  const address = req.params.address;
  const addressData = bitcoin.getAddressData(address);
  res.json({
    addressData: addressData,
  });
});

app.get('/room/:room', function (req, res) {
  const room = req.params.room;
  const roomData = bitcoin.getRoomData(room);

  res.json({
    roomData: roomData,
  });
});

app.get('/date/:date', function (req, res) {
  const date = req.params.date;
  const dateData = bitcoin.getdateData(date);

  res.json({
    dateData: dateData,
  });
});

// 블록 탐색기 접속
app.get('/block-explorer', function (req, res) {
  res.sendFile('./block-explorer/index.html', { root: __dirname });
});

const check = () => {
  request.post(`http://${ip.address()}:${port}/transaction`, function (error, response, body) {});
  setTimeout(check, 60000);
};

app.listen(port, () => {
  console.log(`Server runnint at ${port}`);

  // 다른 IP를 갖는 블록체인 노드와 연결하고 싶을 경우, ip.address()를 변경한다.
  const options = {
    uri: `http://${ip.address()}:65011` + '/register-and-broadcast-node',
    // uri: `http://192.168.0.102:65011` + '/register-and-broadcast-node',
    method: 'POST',
    form: {
      newNodeUrl: `http://${ip.address()}:${port}`,
    },
  };

  if (port === '65011') {
    // check();
  }

  console.log(ip.address());

  request.post(options, function (error, response, body) {
    request.get(`http://${ip.address()}:${port}/consensus`, function (error, response, body) {
      console.log(body);
    });
  });
});
