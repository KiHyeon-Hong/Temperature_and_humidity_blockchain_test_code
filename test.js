const request = require('request');
const fs = require('fs');

fs.writeFileSync(__dirname + '/files/data.csv', 'Num of block,Count,Time\n', 'utf8');

let length = 100;
let flag = 0;

async function main() {
  for (let i = 0; i < 100; i++) {
    console.log(await test());
  }
}

function registration() {
  const registrationRequest = () => {
    return new Promise((resolve) => {
      request.post(`http://localhost:65011/transaction`, function (error, response, body) {
        resolve(body);
      });
    });
  };

  return registrationRequest();
}

function consensus() {
  const consensusRequest = () => {
    return new Promise((resolve) => {
      request.get(`http://localhost:65011/consensus`, function (error, response, body) {
        resolve(body);
      });
    });
  };

  return consensusRequest();
}

function test() {
  const testQuery = () => {
    return new Promise(async (resolve) => {
      for (let i = 0; i < length; i++) {
        await registration();
      }

      flag += length;

      let start = 0;
      for (let i = 0; i < 10; i++) {
        start = new Date();
        console.log(await consensus());
        fs.appendFileSync(__dirname + '/files/data.csv', `${flag},${i + 1},${new Date() - start}\n`, 'utf8');
      }

      resolve();
    });
  };

  return testQuery();
}

main();
