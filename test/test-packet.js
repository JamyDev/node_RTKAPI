var Packet = require("../lib/packet.js").Packet;

exports.instantiateEmpty = function (test) {
    var p = new Packet();
    test.equal(p.revision, 0x01);
    test.equal(p.killSessionFlag, false);
    test.notEqual(p.time, 0);

    test.equal(p.accessKey, undefined);
    test.equal(p.encrypted, undefined);
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

exports.instantiateFull = function (test) {
    var p = new Packet(false, "f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b", 1, "test", {}, "DATA", 123456, 0x11, false);
    test.equal(p.revision, 0x11);
    test.equal(p.killSessionFlag, false);
    test.equal(p.time, 123456);

    test.equal(p.accessKey.toString("HEX"), "f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b");
    test.equal(p.encrypted, false);
    test.equal(p.sessionID, 1);
    test.equal(p.method, "test");
    test.notEqual(p.params, undefined);
    test.equal(p.data, "DATA");

    p = p.clean();
    test.equal(p.time, 123456);
    test.equal(p.sessionID, 1);
    test.equal(p.method, "test");
    test.notEqual(p.params, undefined);
    test.equal(p.data, "DATA");

    test.done();
};

exports.compileUnencrypted = function (test) {
    var p = new Packet(false, "f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b", 1, "test", {}, "DATA", 123456, 0x01, false);

    var data = p.compile();
    test.equal(data.toString("HEX"), "49504352ab01f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b00000001000404746573740044415441");

    test.done();
};

exports.readUnencrypted = function (test) {
    var data = new Buffer("49504352ab01f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b00000001000404746573740044415441", "HEX");
    var p = new Packet(data);

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

    test.done();
};

exports.compileDecompileUnencrypted = function (test) {
    test.done();
};

exports.packetLength = function (test) {
    var packets = [
        [46, new Buffer("49504352ab01f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b0000000100000000", "HEX")],
        [54, new Buffer("49504352ab01f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b00000001000404746573740044415441", "HEX")],
        [66, new Buffer("49504352ab01f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b0000000100040474657374010b706172616d3a76616c756544415441", "HEX")],
        [74, new Buffer("49504352ab01f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b0000000100040474657374020b706172616d3a76616c75650770323a76616c3244415441", "HEX")],
    ];

    packets.forEach(function (p) {
        test.equal(Packet.readLength(p[1]), p[0]);
    });

    test.done();
};