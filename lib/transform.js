var stream = require('stream'),
    packet = require("./packet.js");

function construct (ee) {

    var transform = new stream.Transform();

    transform.prevBuff = new Buffer(0);

    transform._transform = function (data, enc, cb) {
        if (transform.prevBuff.length > 0) { // Check for previously unparsed data
            data = Buffer.concat([transform.prevBuff, data]);
            transform.prevBuff = new Buffer(0);
        }
        var l = packet.packetLength(data);
        if (data.length === l) {
            try {
                packet.read(data, function (p) {
                    if (p.error) {
                        return;
                    }
                    if (p.method === "event") {
                        ee.emit(p.params.class, p.clean());
                    } else {
                        ee.emit(p.sessionID, p.clean());
                    }
                });
            } catch (e) {
                console.trace("RTKAPI: Error reading packet in transform", e);
            }
            cb();
        } else if (data.length > l) {
            var i = true;
            while (i) {
                try {
                    packet.read(data.slice(0, l), function (p) {
                        if (p.error) {
                            return;
                        }
                        if (p.method === "event") {
                            ee.emit(p.params.class, p.clean());
                        } else {
                            ee.emit(p.sessionID, p.clean());
                        }
                    });
                } catch (e) {
                    console.log(e);
                }

                data = data.slice(l);
                l = packet.packetLength(data);
                if (data.length < l) {
                    if (data.length > 0)
                        transform.prevBuff = data;
                    i = false;
                    cb();
                }
            }
        } else if (data.length < l) {
            transform.prevBuff = data;
            cb();
        } else {
            // This shouldn't happen
        }
    };

    transform.on('error', function (e) {
        console.log("RTKAPI: Error parsing data",e);
    });

    return transform;
}

module.exports.construct = construct;