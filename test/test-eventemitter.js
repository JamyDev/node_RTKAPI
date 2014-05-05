var RTKEventEmitter = require("../lib/eventemitter.js").RTKEventEmitter;

exports.setUp = function (callback) {
    this.ee = new RTKEventEmitter();
    callback();
};

exports.registerEventsOn = function (test) {
    test.expect(1);
    this.ee.on('test', 'nodeunit', function (value) {
        test.equals(value, "testValue");
        test.done();
    });
    this.ee.emit('test', "testValue");
};

exports.registerEventsOnce = function (test) {
    test.expect(1);
    var ee = this.ee;
    ee.once('test2', 'nodeunit', function (value) {
        test.equals(value, "testValue");
        // Verify that it doesn't run twice
        ee.emit('test2', "testValue2");
        setTimeout(test.done);
    });
    ee.emit('test2', "testValue");
};

exports.multipleListeners = function (test) {
    test.expect(2);
    var done = false;
    this.ee.on('test', 'nodeunit', function (value) {
        test.equals(value, "testValue");
        if (done)
            test.done();
        else
            done = true;
    });
    this.ee.on('test', 'nodeunit2', function (value) {
        test.equals(value, "testValue");
        if (done)
            test.done();
        else
            done = true;
    });
    this.ee.emit('test', "testValue");
};

exports.registerEventsOff = function (test) {
    test.expect(1);
    this.ee.on('test', 'nodeunit', function (value) {
        test.equals(value, "testValue");
        setTimeout(test.done);
    });
    this.ee.on('test', 'nodeunit2', function (value) {
        test.ifError(true);
        test.done();
    });
    this.ee.off('test', 'nodeunit2');
    this.ee.emit('test', "testValue");
};

exports.registerEventsRemoveAll = function (test) {
    test.expect(1);
    this.ee.on('test', 'nodeunit', function (value) {
        test.ifError(true);
        test.done();
    });
    this.ee.on('test', 'nodeunit2', function (value) {
        test.ifError(true);
        test.done();
    });
    this.ee.on('test2', 'nodeunit', function (value) {
        test.equals(value, "testValue2");
        setTimeout(test.done);
    });

    this.ee.removeAllListeners('test');
    this.ee.emit('test', "testValue");
    this.ee.emit('test2', "testValue2");
};

exports.getListeners = function (test) {
    this.ee.on('test', 'nodeunit2', function (value) {});
    this.ee.on('test2', 'nodeunit', function (value) {});

    var l = this.ee.getListeners();

    test.equals(l.length, 2);
    test.ok(l.indexOf('test') !== -1);
    test.ok(l.indexOf('test2') !== -1);

    test.done();
};

exports.registerEventsOnOnce = function (test) {
    // The .on listener should fire thwice and the .once only once
    test.expect(3);
    this.ee.on('test', 'nodeunit', function (value) {
        test.equals(value, "testValue");
    });
    this.ee.once('test', 'nodeunit', function (value) {
        test.equals(value, "testValue");
    });

    this.ee.emit('test', 'testValue');
    this.ee.emit('test', 'testValue');
    setTimeout(test.done);
};

exports.secondEE = function (test) {
    test.expect(1);
    var sEE = new RTKEventEmitter();
    this.ee.on("herp", 'token', function () {
        test.fail(true);
    });
    sEE.on('herp', 'token', function () {
        test.ok(true);
        test.done();
    });
    sEE.emit('herp');
};




