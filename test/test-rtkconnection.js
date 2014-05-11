var RTKConnection = require("../lib/rtkconnection.js").RTKConnection;
var RTKTransform = require("../lib/transform.js").RTKTransform;
var Packet = require("../lib/packet.js").Packet;
var net = require('net');

exports.setUp = function (callback) {
	var ex = this;
	ex.transform = null;
	ex.server = net.createServer(function (con) {
		ex.transform = new RTKTransform();
		//ex.transform.removeAllListeners();
		con.pipe(ex.transform);
    	ex.transform.on('data', function (p) {
    		if (p.method === 'enablePersistence')
    			con.write((new Packet(false, "0000000000000000000000000000000000000000000000000000000000000000", p.sessionID, "apiNotice", {}, "persistenceEnabled", null, 0x01, false)).compile());
    		else if (p.method === "getServerState")
    			con.write((new Packet(false, "0000000000000000000000000000000000000000000000000000000000000000", p.sessionID, "apiNotice", {}, JSON.stringify({state: "RUNNING"}), null, 0x01, false)).compile());
    		//console.log(JSON.stringify(p));
    		// else
    		// 	console.log("unknownp", p);
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

// exports.unexpectedQuit = function (test) {
// 	test.expect(1);
// 	var ex = this;
// 	var $api = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
// 		ex.server.close();
// 		test.ok(true);
// 	});
	
// };

exports.statusChange = function (test) {
	test.expect(1);
	var $api = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
		$api.enablePersistence();
	});

	$api.on("status", 'api', function () {
		$api.removeAllListeners();
		console.log($api.getStatus())
		test.ok($api.status === 4);
		test.done();
	});
};

exports.reconnections = function (test) {
	test.expect(10);
	var $api = new RTKConnection({host: "localhost", port: 255666, username: "spacecp", password: "spacecp", salt: "E9tR0dw78FnQ3VY6qYVXhMOAGwYakhbrJBcZOQjltnVBQgRbCqZ1QJGkx2hqZa6", secure: false}, function () {
		$api.enablePersistence();

		setTimeout(function () {
			$api.disconnect();
			test.ok($api.getStatus() === 0);
			setTimeout(function () {
				$api.connect();
			}, 2000)
		}, 1000)
	});

	$api.on("status", 'api', function () {
		// $api.removeAllListeners();
		console.log($api.getStatus())
		// test.ok($api.status === 4);
		// test.done();
	});
};

// exports.eventListeners = function (test) {
// 	test.expect(1);
// 	setInterval(console.log, 2000, 1);
// 	var $api = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
// 		$api.enablePersistence();
		
// 		$api.on("com.drdanick.rtoolkit.event.WrapperConsoleOutputEvent", "asdf", function (con) {
// 			test.ok(true);
// 			test.done();
// 		});
// 		$api.call('consoleCommand', {}, "asdfasdf", function (resp) {
// 			console.log("resp");
// 		});
		
// 	});
	
	
// }

exports.multipleServers = function  (test) {
	var $api1 = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
		$api1.enablePersistence();
		test.ok("Done1")
	});
	var $api2 = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
		$api2.enablePersistence();
		test.ok("Done2")
	});
	var $api3 = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
		$api3.enablePersistence();
		test.ok("Done3")
	});
	var $api4 = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
		$api4.enablePersistence();
		test.ok("Done4")
	});
	var $api5 = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
		$api5.enablePersistence();
		test.ok("Done5")
	});
	var $api6 = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
		$api6.enablePersistence();
		test.ok("Done6")
	});
	var $api7 = new RTKConnection({host: "localhost", port: 25566, username: "user", password: "password", salt: "", secure: false}, function () {
		$api7.enablePersistence();
		test.ok("Done7")
		test.done();
	});
}

exports.tearDown = function (callback) {
	this.server.close();
	if (this.transform)
		this.transform.removeAllListeners();
	callback();
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