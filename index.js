var sys 	= require('sys'),
    events 	= require('events'),
    put 	= require('put'),
    crypto 	= require('crypto'),
    net 	= require('net');

var REV = 0x01;

var Server = function(host, port, username, pass, salt, secure) {
    if(false === (this instanceof Server)) {
        return new Server(host, port, username, pass, salt, secure);
    }

    var self = this;
    
    events.EventEmitter.call(this);

    if (secure) {
    	this.key = 'secure';
    } else {
    	//this.key = "12345678901234567890123456789012:34567890123456789012345678901234"
    	this.key = crypto.createHash('sha1').update(username+salt).digest('hex')+':'+crypto.createHash('sha1').update(pass+salt).digest('hex');
    }

    this.secure = secure;

    this.sessionid = 0;

    this.lastCall = {};

    this.con = net.connect(port, host, function () {
		this.status = true;
	});

	this.con.on('close', function () {
		this.status = false;
	});

	this.con.on('data', function (d) {
		decrypt(self, d);
	});
}
sys.inherits(Server, events.EventEmitter);

Server.prototype.call = function(method, params) {
	var self = this;
	var b = encrypt(this, method, params);

	this.con.write(b);
}

var connect = function(host, port, username, pass, salt, secure) {
	return new Server(host, port, username, pass, salt, secure);
}

// exports
exports.Server = Server;
exports.connect = connect;

// Private functions
function decrypt(server, buff) {
	var call = {};
	var pos = 0;
	// check magic nr
	if (buff.readInt32BE(pos) != 0x49504352) {
		call.err = "Magic number incorrect";
		server.emit('call', call);
	} else {
		pos += 4;
		// check constant
		if (buff[pos] == 0xAB) {
			var endian = 1;
		} else if (buff[pos] == 0xBA) {
			var endian = 0;
		} else {
			call.err = "Constant incorrect";
			server.emit('call', call);
		}
		pos++;

		// revision
		var enc = buff[pos] & 0x80;
		var rev = buff[pos] & 0x7F;
		pos++;
		if (rev > REV) {
			call.err = "Server protocol is newer than clients";
			server.emit('call', call);
		}

		if (enc >> 0) {
			call.secure = true;
			/* TODO: Parse secure
			*  TODO: Parse secure
			*  TODO: Parse secure
			*  TODO: Parse secure
			*  TODO: Parse secure
			*/
		} else {
			call.secure = false;
			// Parse unsecure
			// Parse accesskey
			var accesskey = buff.slice(pos, pos + 81).toString();
			pos += 81;
			if (accesskey == server.key && server.secure == call.secure) {

				// Parse SessionID
				switch (endian) {
					case 0:
						call.sessionid = buff.readInt32LE(pos);
						break;
					case 1:
						call.sessionid = buff.readInt32BE(pos);
						break;
					default:
						call.err = "Invalid endian/sessionID!";
						server.emit('call', call);
						break;
				}
				pos += 4;

				server.sessionid = call.sessionid;

				//Method
				var methodl = buff[pos];
				pos++;
				call.method = buff.slice(pos, pos+methodl).toString();
				pos += methodl;

				// Parameters
				var pc = buff[pos];
				pos++;
				call.params = {};
				for (i = 1; i<= pc; i++) {
					var pl = buff[pos];
					pos++;
					var p = buff.slice(pos, pos+pl).toString().split(':');
					call.params[p[0]] = p[1];
					pos += pl;
				}
				server.lastCall = call;
				server.emit('call', call);
			} else {
				call.err = "Invalid accesskey!";
				server.emit('call', call);
			}
		}
	}
}

function encrypt(server, method, params) {
	var b = new put()
    .word32be(0x49504352)
    .word8(0xAB)
    .word8(revision);

	var revision = REV;
	if (server.secure) {
		revision |= 0x80;
		/*
		*  TODO: Encrypted method
		*  TODO: Encrypted method
		*  TODO: Encrypted method
		*  TODO: Encrypted method
		*/
	} else {
		b = b.put(new Buffer(server.key))
	    .word32be(0)
	    .word8(method.length)
	    .put(new Buffer(method))

	    i = 0;
	    for (var key in params) {
	    	i++;
	    }
	    b = b.word8(i);
	    for (var key in params) {
	    	var text = key+':'+params[key];
	    	b = b.word8(text.length)
	        .put(new Buffer(text));
	    }
	}
	
    
    return b.buffer();
}