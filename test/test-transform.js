var RTKTransform = require("../lib/transform.js").RTKTransform;
var Packet = require("../lib/packet.js").Packet;
var Transform = require("stream").Transform;

exports.instantiate = function (test) {
    var transform1 = new RTKTransform();
    test.ok(transform1 instanceof Transform);

    test.done();
};

exports.readFullPacket = function (test) {
    test.expect(14);
    var transform2 = new RTKTransform();
    transform2.on('data', function (p) {
        test.equal(p.revision, 0x01);
        test.equal(p.killSessionFlag, false);
        test.notEqual(p.time, undefined);

        test.equal(p.accessKey.toString("HEX"), "f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b");
        test.equal(p.encrypted, false);
        test.equal(p.sessionID, 1);
        test.equal(p.method, "test");
        test.notEqual(p.params, undefined);
        test.equal(p.data, "DATA");

        p = p.clean();
        test.notEqual(p.time, undefined);
        test.equal(p.sessionID, 1);
        test.equal(p.method, "test");
        test.notEqual(p.params, undefined);
        test.equal(p.data, "DATA");

        transform2.end();
    });
    transform2.on('finish', function () {
        transform2.removeAllListeners('data').removeAllListeners('finish');
        test.done();
    });

    transform2.write(new Buffer("49504352ab01f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b00000001000404746573740044415441", "HEX"));
};

exports.readFullPacketDelayed = function (test) {
    test.expect(14);
    var transform3 = new RTKTransform();
    transform3.on('data', function (p) {
        test.equal(p.revision, 0x01);
        test.equal(p.killSessionFlag, false);
        test.notEqual(p.time, undefined);

        test.equal(p.accessKey.toString("HEX"), "f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b");
        test.equal(p.encrypted, false);
        test.equal(p.sessionID, 1);
        test.equal(p.method, "test");
        test.notEqual(p.params, undefined);
        test.equal(p.data, "DATA");

        p = p.clean();
        test.notEqual(p.time, undefined);
        test.equal(p.sessionID, 1);
        test.equal(p.method, "test");
        test.notEqual(p.params, undefined);
        test.equal(p.data, "DATA");

        transform3.end();
    });
    transform3.on('finish', function () {
        transform3.removeAllListeners('data').removeAllListeners('finish');
        test.done();
    });
    transform3.write(new Buffer("49504352ab01f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b0000000100040474", "HEX"));
    setTimeout(function () {
        transform3.write(new Buffer("6573740044415441", "HEX"));
    }, 200);
};

exports.createBufferFromPacket = function (test) {
    test.expect(1);
    var transform4 = new RTKTransform();
    transform4.on('data', function (b) {
        test.equals(b.toString("HEX"), "49504352ab01f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b00000001000404746573740044415441");
        transform4.end();
    });

    transform4.on('finish', function () {
        transform4.removeAllListeners('data').removeAllListeners('finish');
        test.done();
    });
    transform4.write(new Packet(false, "f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b", 1, "test", {}, "DATA", 123456, 0x01, false));
};