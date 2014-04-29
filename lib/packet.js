var PUT = require("put");

var REV = 0x01;

// PUBLICS

function Packet (enc, key, sid, method, params, data, time, rev, ksf) {
    if (enc instanceof Buffer)
        return Packet.parse(enc);
    if (!(key instanceof Buffer) && key)
        key = new Buffer(key, "HEX");
    this.revision = (rev) ? rev : REV;
    this.encrypted = enc;
    this.time = (time) ? time : Math.floor(Date.now()/1000);
    this.killSessionFlag = (ksf) ? true : false;
    this.accessKey = key;
    this.sessionID = sid;
    this.method = method;
    this.params = params;
    this.data = data;

    return this;
}

Packet.prototype.clean = function () {
    return {
        time: this.time,
        method: this.method,
        sessionID: this.sessionID,
        params: this.params,
        data: this.data
    };
};

Packet.prototype.compile = function () {
    var self = this;
    var raw = writeHead(self);
    if (self.encrypted)
        raw = writeEncrypted(self, raw);
    else
        raw = writeUnencrypted(self, raw);
    return raw.buffer();
};

// STATIC METHODS

// An rtk packet looks like this: 4Bytes/32bits init header: 0x49504352, 1Byte/8bits
// endianness: 0xAB, 1Byte/8bits revision, the access key, 4Bytes/32bits sessionID,
// 2Bytes/16bits data length, 1Byte/8bits method length, the method, 1Byte/8bits
// parameter count, 1Byte/8bits parameter length, parameter, data

Packet.readLength = function (buffer) {
    var a,b,c=0,d,x=0;
    if (buffer.length < 45) return buffer.length+1; // Check if it's smaller than 45, if so return 1 bigger so the assert fails
    a = buffer[44]; // Get the 45th Byte, what I guess is the method length
    if (buffer.length < 46+a) return buffer.length+1+a; // If the packet is smaller than the previous part, plus the method length and the method itself, return 1 bigger so the assert fails
    b = buffer[45+a]; // Get the Byte after the method name, (parameter count)
    for (var i = 0; i < b; i++) { // for each parameter, check the parameter length, check if it's still longer than that, and save it in c
        if (buffer.length < 46+a+i+c) return buffer.length+1+a+i+c;
        x = buffer[46+a+i+c];
        c += x;
    }
    d = buffer.readInt16BE(42); // Get the data length
    return 46+a+b+c+d;
};

Packet.parse = function (buffer) {
    if (buffer instanceof Buffer)
        return read(buffer);
    else
        return false;
};

function read (buffer) {
    var data = {};
    // Validate header
    data = readHead(buffer, 0);
    if (!data)
        return false; // ?

    if (data.enc)
        return readEncrypted(buffer, data);
    else
        return readUnencrypted(buffer, data);
}

function readHead (buffer, pos) {
    var data = {};
    if (buffer.length < pos+5)
        return false;
    if (buffer.readInt32BE(pos) !== 0x49504352)
        return false;
    pos += 4;
    // check constant
    if (buffer[pos] !== 0xAB)
        return false;
    var endian = 1;
    pos++;

    data.rev = buffer[pos];
    data.enc = ((data.rev & 0x80) !== 0);
    data.ksf = ((data.rev & 0x40) !== 0);
    data.rev &= 0x3F;
    pos++;
    
    data.pos = pos;
    return data;
}

function readEncrypted (buffer, pos) {
    // Do encrypted stuff
    // Will probably need decrypt key etc

    return false;
}

function readUnencrypted (buffer, data) {
    var pos = data.pos;
    data.key = buffer.slice(pos, pos + 32).toString('hex');
    pos += 32;

    data.sid = buffer.readInt32BE(pos);
    pos += 4;

    data.dl = buffer.readInt16BE(pos);
    pos += 2;

    data.ml = buffer[pos];
    pos++;

    data.method = buffer.slice(pos, pos+data.ml).toString('utf8');
    pos += data.ml;

    data.pc = buffer[pos];
    pos++;

    data.params = {};
    for (var i = 1; i<= data.pc; i++) {
        var pl = buffer[pos];
        pos++;

        var p = buffer.slice(pos, pos+pl).toString('utf8').split(":");
        data.params[p[0]] = p[1];
        pos += pl;
    }

    data.data = '';
    if (data.dl > 0)
        try {
            data.data = JSON.parse(buffer.slice(pos, pos+data.dl).toString('utf8'));
        } catch (e) {
            data.data = buffer.slice(pos, pos+data.dl).toString('utf8');
        }

    pos += data.dl;

    return new Packet(data.enc, data.key, data.sid, data.method, data.params, data.data, false, data.rev, data.ksf);
}

function writeHead (packet) {
    var rev = packet.revision;
    if (packet.encrypted) rev |= 0x80;
    if (packet.killSessionFlag) rev |= 0x40;

    return new PUT()
    .word32be(0x49504352)
    .word8(0xAB)

    .word8(rev)
    .put(packet.accessKey);

}

function writeEncrypted (packet, raw) {
    return false;
}

function writeUnencrypted (packet, raw) {
    raw = raw.word32be(packet.sessionID)
    .word16be(packet.data.length)
    .word8(packet.method.length)
    .put(new Buffer(packet.method));

    i = 0;
    for (var k in packet.params) {
        i++;
    }
    raw = raw.word8(i);
    for (var l in packet.params) {
        var text = l+":"+packet.params[l];
        put = raw.word8(text.length)
        .put(new Buffer(text));
    }
    raw = raw.put(new Buffer(packet.data));

    return raw;
}


exports.Packet = Packet;