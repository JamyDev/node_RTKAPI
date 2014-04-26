var Packet 			= require('./packet.js').Packet,
    RTKEventEmitter = require('./eventemitter.js').RTKEventEmitter,
    RTKTransform 	= require('./transform.js').RTKTransform,

    Duplex 			= require("stream").Duplex,
    net 			= require('net'),
    _ 				= require('underscore'),
    crypto 			= require('crypto');

var RTKConnection = function (info, callback) {
	if(false === (this instanceof RTKConnection)) {
	    return new RTKConnection(info, callback);
	}

	var $global = this,
	    $local  = {};

	if (typeof info === 'object' &&
	    typeof info.host === 'string' &&
	    typeof info.port === 'number' &&
	    typeof info.username === 'string' &&
	    typeof info.password === 'string' &&
	    typeof info.salt === 'string')
	{
		// Global
		$global.host = info.host;
		$global.port = info.port;
		$global.errorCount = 0;
		$global.connected = false;
		$global.persistent = false;
		$global.status = 0;
		$global.encrypted = (info.encrypted) ? true : false;

		$local.ee = new RTKEventEmitter();
		$local.transform = new RTKTransform();

		$local.key = "";
		$local.eventsID = 1;
		$local.callsID = 2;

		$local.ee.emit('status', {oldStatus: 0, newStatus: $global.status});


        $local.connection = net.connect({port: $global.port, host: $global.host, allowHalfOpen: false}, function (con) {
            afterConnect();
        });

        handleConnection();
        process.nextTick(function () {
            $local.ee.emit('status', {oldStatus: $global.status, newStatus: 1});
            $global.status = 1;
        });

        // TODO: Finish this class and the events class and the tests <3

        if (info.encrypted)
            $local.key = 'secure';
        else
            $local.key = new Buffer(crypto.createHash("sha256").update(info.username+info.password+info.salt).digest("hex"), "hex");


        // $global.call = call;
        // $global.on = on;
        // $global.off = off;
        // $global.removeAllListeners = removeAllListeners;
        // $global.enablePersistence = enablePersistence;
        // $global.disconnect = disconnect;
        // $global.reconnect = reconnect;
        // $global.getStatus = getStatus;

    } else {
        cb("Invalid info");
    }

	Duplex.call(this, {objectMode: true});
};

RTKConnection.prototype = new Duplex({objectMode: true});

