var RTKConnection = require("../lib/rtkconnection.js").RTKConnection;

exports.setUp = function (callback) {
    this.api = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false});
    callback();
};

// exports.test = function (test) {
//     test.ok(true);
//     test.done();
// };

// exports.instantiateEmpty = function (test) {
//     var p = new Packet();
//     test.equal(p.revision, 0x01);
//     test.equal(p.killSessionFlag, false);
//     test.notEqual(p.time, 0);

//     test.equal(p.accessKey, undefined);
//     test.equal(p.encrypted, undefined);
//     test.equal(p.sessionID, undefined);
//     test.equal(p.method, undefined);
//     test.equal(p.params, undefined);
//     test.equal(p.data, undefined);

//     p = p.clean();
//     test.notEqual(p.time, 0);
//     test.equal(p.sessionID, undefined);
//     test.equal(p.method, undefined);
//     test.equal(p.params, undefined);
//     test.equal(p.data, undefined);

//     test.done();
// };