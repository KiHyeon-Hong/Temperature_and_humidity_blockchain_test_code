const request = require('request');
const fs = require('fs');

let length = 10;

async function main() {
  for (let i = 0; i < 5; i++) {
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
  const registrationRequest = () => {
    return new Promise((resolve) => {
      request.post(`http://localhost:65011/consensus`, function (error, response, body) {
        resolve(body);
      });
    });
  };

  return registrationRequest();
}

function test() {
  const testQuery = () => {
    return new Promise(async (resolve) => {
      for (let i = 0; i < length; i++) {
        await registration();
      }

      let start = new Date();
      await consensus();
      resolve(new Date() - start);
    });
  };

  return testQuery();
}

main();
