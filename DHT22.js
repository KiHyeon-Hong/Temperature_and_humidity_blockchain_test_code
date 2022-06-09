// const sensorLib = require('node-dht-sensor');

function getDate() {
  const d = new Date();

  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

// 온습도 데이터 측정 class
class DHT22 {
  // async get() {
  //   const myData = new Promise((resolve) => {
  //     const sensor = {
  //       sensors: [
  //         {
  //           name: 'Outdoor',
  //           type: 22,
  //           pin: 21,
  //         },
  //       ],
  //       read: function () {
  //         for (var index in this.sensors) {
  //           var s = sensorLib.read(this.sensors[index].type, this.sensors[index].pin);
  //           resolve({ temperature: parseFloat(s.temperature.toFixed(1)), humidity: parseFloat(s.humidity.toFixed(1)), date: getDate(), room: 219 });
  //         }
  //       },
  //     };
  //     sensor.read();
  //   });
  //   return await myData;
  // }

  async get() {
    return await { temperature: 20.5, humidity: 50.2, date: getDate(), room: 220 };
  }
}

module.exports.DHT22 = DHT22;
