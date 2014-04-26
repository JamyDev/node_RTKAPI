var Transform 	= require("stream").Transform,
	Packet		= require("./packet.js").Packet;

var RTKTransform = function () {
	this._unparsedBuffer = new Buffer(0);
	Transform.call(this, {objectMode: true});
};

RTKTransform.prototype = new Transform({objectMode: true});

RTKTransform.prototype._transform = function (data, encoding, done) {
	var p, buff;
	if (data instanceof Packet) {
		buff = data.compile();
		this.push(buff);
		done();
	}
	if (data instanceof Buffer) {
		if (this._unparsedBuffer.length > 0) {
			data = Buffer.concat([this._unparsedBuffer, data]);
			this._unparsedBuffer = new Buffer(0);
		}

		var len = Packet.readLength(data);
		if (data.length === len) {
			p = Packet.parse(data);
			this.push(p);
			done();
		} else if (data.length > len) {
			var i = true;
			while (i) {
			    p = Packet.parse(data.slice(0, len));
			    this.push(p);

			    data = data.slice(len);
			    len = Packet.readLength(data);
			    if (data.length < len) {
			        if (data.length > 0)
			            this._unparsedBuffer = data;
			        i = false;
			        done();
			    }
			}
		} else if (data.length < len) {
			this._unparsedBuffer = data;
			done();
		}
	}

	
};

RTKTransform.prototype._flush = function (data, encoding, done) {
	// Make toilet noises
	if (this._unparsedBuffer.length > 0) {
		var len = Packet.readLength(data);
		if (data.length === len) {
			p = Packet.parse(data);
			this.push(p);
			done();
		} else if (data.length > len) {
			var i = true;
			while (i) {
			    p = Packet.parse(data.slice(0, len));
			    this.push(p);

			    data = data.slice(len);
			    len = Packet.readLength(data);
			    if (data.length < len) {
			        if (data.length > 0)
			            this._unparsedBuffer = data;
			        i = false;
			        done();
			    }
			}
		}
	}
};

exports.RTKTransform = RTKTransform;