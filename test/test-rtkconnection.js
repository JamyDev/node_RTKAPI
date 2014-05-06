var RTKConnection = require("../lib/rtkconnection.js").RTKConnection;
var RTKTransform = require("../lib/transform.js").RTKTransform;
var Packet = require("../lib/packet.js").Packet;
var net = require('net');

exports.setUp = function (callback) {
	var ex = this;
	ex.transform = null;
	ex.server = net.createServer(function (con) {
		ex.transform = new RTKTransform();
		con.pipe(ex.transform);
    	ex.transform.on('data', function (p) {
    		if (p.method === 'enablePersistence')
    			con.write((new Packet(false, "0000000000000000000000000000000000000000000000000000000000000000", p.sessionID, "apiNotice", {}, "persistenceEnabled", null, 0x01, false)).compile());
    		else if (p.method === "getServerState")
    			con.write((new Packet(false, "0000000000000000000000000000000000000000000000000000000000000000", p.sessionID, "apiNotice", {}, JSON.stringify({state: "RUNNING"}), null, 0x01, false)).compile());
    		else
    			console.log("unknownp", p);
    	});
		
	});
	
	ex.server.listen(25566);
	callback();

};

exports.connectedEvent = function (test) {
	test.expect(1);
	var $api = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {

	});

	$api.on("connected", 'api', function () {
		$api.removeAllListeners();
		test.ok(true);
		test.done();
	});
};

exports.eventListeners = function (test) {
	test.expect(1);
	setInterval(console.log, 2000, 1)
	var $api = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
		$api.enablePersistence();
		
		$api.on("com.drdanick.rtoolkit.event.WrapperConsoleOutputEvent", "asdf", function (con) {
			test.ok(true);
			test.done();
		});
		$api.call('consoleCommand', {}, "asdfasdf", function (resp) {
			console.log("resp")
		})
		
	});
	
	
}

exports.tearDown = function (callback) {
	this.server.close();
	callback()
}

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