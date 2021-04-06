const I2C = require('node-i2c-js');

const i2c = new I2C(address, { device });

run();

async function run() {
	// this
	try {
		let d = await i2c.readBytes(cmd, length);
		let e = await i2c.writeBytes(cmd, buf);
	} catch (error) {
		console.log(error);
	}

	// or this
	i2c.readBytes(cmd, length)
		.then(() => i2c.writeBytes(cmd, buf))
		.catch((error) => console.log(error));
}
