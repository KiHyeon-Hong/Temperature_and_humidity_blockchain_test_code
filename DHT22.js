// const sensorLib = require('node-dht-sensor');

class DHT22 {
  // get() {
  //   const sensor = {
  //     sensors: [
  //       {
  //         name: 'Outdoor',
  //         type: 22,
  //         pin: 21,
  //       },
  //     ],
  //     read: function () {
  //       for (var index in this.sensors) {
  //         var s = sensorLib.read(this.sensors[index].type, this.sensors[index].pin);
  //         return JSON.parse({ temperature: s.temperature.toFixed(1), humidity: s.humidity.toFixed(1) });
  //       }
  //     },
  //   };
  //   sensor.read();
  // }

  get() {
    return { temperature: 20, humidity: 50 };
  }
}

module.exports.DHT22 = DHT22;
