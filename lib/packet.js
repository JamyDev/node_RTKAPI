var put = require("put");

// PUBLICS

function Packet (enc, key, sid, method, params, data, time, rev, ksf) {
    this.revision = (rev) ? rev : 0x01;
    this.encrypted = enc;
    this.time = (time) ? time : Math.floor((new Date()).getTime()/1000);
    this.killSessionFlag = (ksf) ? true : false;
    this.accessKey = key;
    this.sessionID = sid;
    this.method = method;
    this.params = params;
    this.data = data;


    return this;
}

Packet.prototype.clean = function clean () {
    return {
        time: this.time,
        method: this.method,
        sessionID: this.sessionID,
        params: this.params,
        data: this.data
    };
};

Packet.prototype.compile = function compile (cb) {
    var self = this;
    if (self.encrypted) {
        process.nextTick(function () {
            writeEncrypted(self, cb);
        });
    } else {
        process.nextTick(function () {
            write(self, cb);
        });
    }
    return this;
};

Packet.prototype.validate = function validate (server, cb) {
    var self = this;
    if (self.encrypted) {
        process.nextTick(function () {
            // validate secure stuff
        });
    } else {
        process.nextTick(function () {
            // validate stuff
        });
    }
};

function packetLength (buffer) {
    var a,b,c=0,d,x=0;
    if (buffer.length < 45) return buffer.length+1;
    a = buffer[44];
    if (buffer.length < 46+a) return buffer.length+1+a;
    b = buffer[45+a];
    for (var i = 0; i < b; i++) {
        if (buffer.length < 47+a+i+c) return buffer.length+1+a+i+c;
        x = buffer[46+a+i+c];
        c += x;
    }
    d = buffer.readInt16BE(42);
    return 47+a+c+d;
}


function read (buffer, cb) {
    var packet, rev, enc, time, ksf, sid, key,
        method, ml, //method and length
        params, pc, // parameters and length
        data, dl; // data and length
        var pos = 0;
    // Validate header
    if (buffer.readInt32BE(pos) === 0x49504352) {
        pos += 4;
        // check constant
        if (buffer[pos] == 0xAB) {
            var endian = 1;
            pos++;

            rev = buffer[pos];
            enc = ((rev & 0x80) !== 0);
            ksf = ((rev & 0x40) !== 0);
            rev &= 0x3F;
            pos++;

            if (enc) {
                /* TODO: Parse secure
                *  TODO: Parse secure
                *  TODO: Parse secure
                *  TODO: Parse secure
                *  TODO: Parse secure
                */
            } else {
                key = buffer.slice(pos, pos + 32).toString('hex');
                pos += 32;

                sid = buffer.readInt32BE(pos);
                pos += 4;

                dl = buffer.readInt16BE(pos);
                //console.log("RealData: "+dl)
                pos += 2;

                ml = buffer[pos];
                pos++;

                method = buffer.slice(pos, pos+ml).toString();
                pos += ml;

                pc = buffer[pos];
                pos++;

                params = {};
                for (i = 1; i<= pc; i++) {
                    var pl = buffer[pos];
                    pos++;

                    var p = buffer.slice(pos, pos+pl).toString().split(":");
                    params[p[0]] = p[1];
                    pos += pl;
                }

                data = '';
                if (dl > 0) {
                    data = buffer.slice(pos, pos+dl).toString();
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        //console.log(data)
                        cb({error: true});
                        return;
                    }
                    
                }
                pos += dl;

                packet = new Packet(enc, key, sid, method, params, data, false, rev, ksf);
                cb(packet);
            }
        } else {
            try {
                cb(false);
            } catch (e) {
                
            }
        }
    } else {
        try {
            cb(false);
        } catch (e) {
            
        }
    }
}

function write (packet, cb) {
    var b, rev;

    b = new put()
    .word32be(0x49504352)
    .word8(0xAB)


    .word8(packet.revision)
    .put(packet.accessKey)
    .word32be(packet.sessionID)
    .word16be(packet.data.length)
    .word8(packet.method.length)
    .put(new Buffer(packet.method));

    i = 0;
    for (var k in packet.params) {
        i++;
    }
    b = b.word8(i);
    for (var l in packet.params) {
        var text = l+":"+packet.params[l];
        b = b.word8(text.length)
        .put(new Buffer(text));
    }
    b = b.put(new Buffer(packet.data));

    cb(b.buffer());
    return;
}

function writeEncrypted () {
    //TODO
}


exports.read = read;
exports.packetLength = packetLength;
exports.Packet = Packet;