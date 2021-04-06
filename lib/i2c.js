const wire = require('../build/Release/i2c');
const EventEmitter = require('events').EventEmitter;
const tick = setImmediate || process.nextTick;

class i2c extends EventEmitter {
  	constructor(address, options) {
    	super();

		this.history = [];
		this.address = address;
		this.options = Object.assign({}, { debug: false, device: "/dev/i2c-1" }, options || {});

		if (this.options.debug) {
			require('repl').start({prompt: "i2c > "}).context.wire = this;
			process.stdin.emit('data', ''); // trigger repl
		}

    	process.on('exit', () => this.close());
		this.on('data', (data) => this.history.push(data));
    	this.on('error', (err) => console.log(`Error: ${err}`));
		this.open(this.options.device, (err) => !err ? this.setAddress(this.address) : undefined);
	}

	async scan() {
		return new Promise((res, rej) => wire.scan((err, data) => tick(() => err ? rej(err) : res(data.filter((d) => d >= 0)))));
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

	async write(buf, callback) {
		if (this.options.debug) console.log(`value ${buf}`);
		this.setAddress(this.address);
		if (!Buffer.isBuffer(buf)) { buf = new Buffer(buf); }
		return new Promise((res, rej) => wire.write(buf, (err) => tick(() => err ? rej(err) : res())));
	}

	async writeByte(byte, callback) {
		if (this.options.debug) console.log(`byte ${byte.toString(16)}`);
		this.setAddress(this.address);
		return new Promise((res, rej) => wire.writeByte(byte, (err) => tick(() => err ? rej(err) : res())));
	}

	async writeBytes(cmd, buf, callback) {
		if (!(buf instanceof Array)) buf = [buf];
		if (this.options.debug) console.log(`cmd ${cmd.toString(16)} values ${buf}`);
		this.setAddress(this.address);
		if (!Buffer.isBuffer(buf)) { buf = new Buffer(buf); }
		return new Promise((res, rej) => wire.writeBlock(cmd, buf, (err) => tick(() => err ? rej(err) : res(buf))));
	}

	async read(len, callback) {
		this.setAddress(this.address);
		return new Promise((res, rej) => wire.read(len, (err, data) => tick(() => err ? rej(err) : res(data))));
	}

	async readByte(callback) {
		this.setAddress(this.address);
		return new Promise((res, rej) => wire.readByte((err, data) => tick(() => err ? rej(err) : res(data))));
	}

	async readBytes(cmd, len) {
		this.setAddress(this.address);
		return new Promise((res, rej) => wire.readBlock(cmd, len, null, (err, actualBuffer) => tick(() => err ? rej(err) : res(actualBuffer))));
	}

	stream(cmd, len, delay) {
		if (delay == null) delay = 100;

		this.setAddress(this.address);
		
		return new Promise((res, rej) => wire.readBlock(cmd, len, delay, (err, data) => {
			if (err) return rej(this.emit('error', err));
			return res(this.emit('data', {address: this.address, data, cmd, length: len, timestamp: Date.now() }));
		}));
	}
}

module.exports = i2c;