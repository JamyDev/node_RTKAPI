var packet = require("../lib/packet.js");

exports['emptyPacket'] = function (test) {
    var p = new packet.Packet();
    test.equal(p.revision, 0x01);
    test.equal(p.killSessionFlag, false);
    test.notEqual(p.time, 0);

    test.equal(p.accessKey, undefined);
    test.equal(p.encryption, undefined);
    test.equal(p.sessionID, undefined);
    test.equal(p.method, undefined);
    test.equal(p.params, undefined);
    test.equal(p.data, undefined);

    p = p.clean();
    test.notEqual(p.time, 0);
    test.equal(p.sessionID, undefined);
    test.equal(p.method, undefined);
    test.equal(p.params, undefined);
    test.equal(p.data, undefined);

    test.done();
};