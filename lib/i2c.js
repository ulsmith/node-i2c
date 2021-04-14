const wire = require('../build/Release/i2c');
const EventEmitter = require('events').EventEmitter;
const tick = setImmediate || process.nextTick;

class i2c extends EventEmitter {
	constructor(address, options) {
		super();

		this.history = [];
		this.address = address;
		this.options = Object.assign({}, { device: "/dev/i2c-1" }, options || {});

		process.on('exit', () => this.close());
		this.on('data', (data) => this.history.push(data));
		this.on('error', (err) => console.log(`Error: ${err}`));
		this.open(this.options.device, (err) => !err ? this.setAddress(this.address) : undefined);
	}

	scan(callback) {
		return wire.scan((err, data) => tick(() => callback(err, data.filter((d) => d >= 0))));
	}

	setAddress(address) {
		wire.setAddress(address);
		return this.address = address;
	}

	open(device, callback) {
		return wire.open(device, (err) => tick(() => callback(err)));
	}

	close() {
		return wire.close();
	}

	write(buf) {
		this.setAddress(this.address);
		buf = !Buffer.isBuffer(buf) ? Buffer.from(buf) : buf;
		wire.write(buf);
	}

	writeByte(byte) {
		this.setAddress(this.address);
		wire.writeByte(byte);
	}

	writeBytes(cmd, buf) {
		this.setAddress(this.address);
		buf = !(buf instanceof Array) ? [buf] : buf;
		buf = !Buffer.isBuffer(buf) ? Buffer.from(buf) : buf;
		wire.writeBlock(cmd, buf);
	}

	read(len) {
		this.setAddress(this.address);
		return new Promise((res, rej) => wire.read(len, (err, data) => err ? rej(err) : res(data)));
	}

	readByte() {
		this.setAddress(this.address);
		return new Promise((res, rej) => wire.readByte((err, data) => err ? rej(err) : res(data)));
	}

	readBytes(cmd, len) {
		this.setAddress(this.address);
		return new Promise((res, rej) => wire.readBlock(cmd, len, null, (err, actualBuffer) => err ? rej(err) : res(actualBuffer)));
	}

	stream(cmd, len, delay) {
		if (delay == null) delay = 100;

		this.setAddress(this.address);

		return new Promise((res, rej) => wire.readBlock(cmd, len, delay, (err, data) => {
			if (err) return rej(this.emit('error', err));
			return res(this.emit('data', { address: this.address, data, cmd, length: len, timestamp: Date.now() }));
		}));
	}
}

module.exports = i2c;