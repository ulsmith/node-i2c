const I2C = require('node-i2c-js');

const i2c = new I2C(address, { device });

i2c.readBytes(cmd, length, function (error, data) {
	if (error) console.log(error);
});

i2c.writeBytes(cmd, buf, function (error, data) {
	if (error) console.log(error);
});