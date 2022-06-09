/*
 * 온습도 블록체인 네트워크 동기화 시간 측정 코드
 */

const request = require('request');
const fs = require('fs');

fs.writeFileSync(__dirname + '/files/data.csv', 'Num of block,Count,Time\n', 'utf8');

let length = 100; // 생성할 블록의 개수
let flag = 0;

async function main() {
  for (let i = 0; i < 1000; i++) {
    console.log(await test());
  }
}

// 온습도 데이터 블록 생성 메소드
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

// 온습도 블록체인 동기화 요청 메소드
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
      // 블록을 length개 (100)를 생성한다.
      for (let i = 0; i < length; i++) {
        await registration();
      }

      flag += length;

      let start = 0;

      // 동기화 시간을 10회 측정한다.
      for (let i = 0; i < 10; i++) {
        start = new Date();
        console.log(await consensus());

        // 동기화 시간 측정 결과는 파일에 기록한다.
        fs.appendFileSync(__dirname + '/files/data.csv', `${flag},${i + 1},${new Date() - start}\n`, 'utf8');
      }

      resolve(flag);
    });
  };

  return testQuery();
}

main();
