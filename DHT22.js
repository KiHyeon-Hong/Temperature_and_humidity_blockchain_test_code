const sensorLib = require('node-dht-sensor');
const { resolve } = require('path');

class DHT22 {
  async get() {
    const myData = new Promise((resolve) => {
      const sensor = {
        sensors: [
          {
            name: 'Outdoor',
            type: 22,
            pin: 21,
          },
        ],
        read: function () {
          for (var index in this.sensors) {
            var s = sensorLib.read(this.sensors[index].type, this.sensors[index].pin);
            resolve({ temperature: s.temperature.toFixed(1), humidity: s.humidity.toFixed(1) });
          }
        },
      };

      sensor.read();
    });

    return await myData;
  }

  // get() {
  //   return { temperature: 20, humidity: 50 };
  // }
}

module.exports.DHT22 = DHT22;
