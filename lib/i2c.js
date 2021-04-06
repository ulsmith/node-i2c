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

	write(buf, callback) {
		this.setAddress(this.address);
		if (!Buffer.isBuffer(buf)) { buf = new Buffer(buf); }
		return wire.write(buf, (err) => tick(() => callback(err)));
	}

	writeByte(byte, callback) {
		this.setAddress(this.address);
		return wire.writeByte(byte, (err) => tick(() => callback(err)));
	}

	writeBytes(cmd, buf, callback) {
		this.setAddress(this.address);
		if (!Buffer.isBuffer(buf)) { buf = new Buffer(buf); }
		return wire.writeBlock(cmd, buf, (err) => tick(() => callback(err)));
	}

	read(len, callback) {
		this.setAddress(this.address);
		return wire.read(len, (err, data) => tick(() => callback(err, data)));
	}

	readByte(callback) {
		this.setAddress(this.address);
		return wire.readByte((err, data) => tick(() => callback(err, data)));
	}

	readBytes(cmd, len, callback) {
		this.setAddress(this.address);
		return wire.readBlock(cmd, len, null, (err, actualBuffer) => tick(() => callback(err, actualBuffer)));
	}

	stream(cmd, len, delay) {
		if (delay == null) delay = 100;

		this.setAddress(this.address);
		
		return wire.readBlock(cmd, len, delay, (err, data) => {
			if (err) return this.emit('error', err);
			else return this.emit('data', {address: this.address, data, cmd, length: len, timestamp: Date.now() });
		});
	}
}

module.exports = i2c;