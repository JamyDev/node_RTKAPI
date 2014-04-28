var Packet          = require('./packet.js').Packet,
    RTKEventEmitter = require('./eventemitter.js').RTKEventEmitter,
    RTKTransform    = require('./transform.js').RTKTransform,

    Writable        = require("stream").Writable,
    net             = require('net'),
    _               = require('underscore'),
    crypto          = require('crypto');

var RTKConnection = function (info, callback) {
    Writable.call(this, {objectMode: true});
    if(false === (this instanceof RTKConnection)) {
        return new RTKConnection(info, callback);
    }

    var $global = this,
        $local  = {};
        $local.$global = $global;

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

        
        $global.connect = connect.bind($local);
        // $global.disconnect = disconnect;
        // $global.reconnect = reconnect;
        // $global.getStatus = getStatus;

        $global.call = call.bind($local);
        $global.enablePersistence = enablePersistence.bind($local);
        $global.on = on.bind($local);
        $global.once = once.bind($local);
        $global.off = off.bind($local);
        $global.removeAllListeners = removeAllListeners.bind($local);

        $local.ee = new RTKEventEmitter();
        $local.transform = null;

        $local.setStatus = setStatus.bind($local);
        $local.afterPersistent = afterPersistent.bind($local);

        $local.key = null;
        $local.eventsID = 1;
        $local.callsID = 2;

        if (info.encrypted)
            $local.key = 'secure';
        else
            $local.key = new Buffer(crypto.createHash("sha256").update(info.username+info.password+info.salt).digest("hex"), "hex");

        $local.setStatus(0, true);
        $global._write = function (packet, encoding, next) {
            if (packet.method === "event") {
                $local.ee.emit(packet.params.class, packet.clean());
            } else {
                $local.ee.emit('packet_'+packet.sessionID, packet.clean());
            }
            next();
        };
        $global.on('error', function (e) {
            console.log(e);
        });

        $global.connect(callback);
    } else {
        callback("Invalid info");
    }

};

RTKConnection.prototype = new Writable({objectMode: true});

function connect (cb) {
    var $local = this;
    if ($local.$global.connected)
        throw new Error("Already connected");
    $local.setStatus(1);
    $local.connection = net.connect({port: $local.$global.port, host: $local.$global.host, allowHalfOpen: false}, function (con) {
        var persistent = $local.$global.persistent;
        $local.transform = new RTKTransform();
        $local.transform.on('error', function (e) {
            console.log(e);
        });
        $local.connection.pipe($local.transform).pipe($local.$global);
        $local.$global.persistent = false;
        $local.$global.connected = true;
        cb();
    });

    $local.connection.on('error', function (e) {
        $local.setStatus(0);
    });

    $local.connection.on('end', function () {
        if (!$local.$global.connected) {
            $local.ee.emit('unreached', false);
        } else {
            $local.ee.emit('disconnected', false);
        }
        $local.setStatus(0);
        $local.$global.connected = false;
    });

    $local.connection.on('close', function () {
        if (!$local.$global.connected) {
            $local.ee.emit('unreached', false);
        } else {
            $local.ee.emit('disconnected', false);
        }
        $local.setStatus(0);
        $local.$global.connected = false;
        $local.$global.errorCount++;
    });
}

function call (method, params, data, cb) {
    $local = this;
    $local.callsID += 1;
    var p = new Packet($local.$global.encrypted, $local.key, $local.callsID, method, params, data);
    $local.ee.once('packet_'+p.sessionID, p.sessionID, cb);
    if ($local.$global.connected)
        $local.connection.write(p.compile());
    else
        cb(false);
}

function enablePersistence () {
    var $local = this;
    if (!$local.$global.persistent) {
        $local.ee.removeAllListeners($local.eventsID);
        $local.$global.persistent = true;
        var p = new Packet($local.$global.encrypted, $local.key, $local.eventsID, 'enablePersistence', {}, '');
        if ($local.$global.connected)
            $local.connection.write(p.compile());
        else
            cb(false);
        $local.ee.once($local.eventsID, 'rtkapi_enablePersistence', $local.afterPersistent);
    }
}

function on (event, token, callback) {
    // body...
}

function once (event, token, callback) {
    // body...
}

function off (event, token) {
    // body...
}

function removeAllListeners (event) {
    // body...
}

function afterPersistent (packet) {
    var $local = this;
    $local.$global.call('getServerState', {}, '', function (p) {
        if (p) {
            p.data.newState = p.data.state;
            $local.ee.emit('com.drdanick.rtoolkit.event.WrapperStateChangedEvent', p);
            $local.setStatus(getStatusInt(p.data.newState));
        } else {
            $local.$global.disconnect();
        }
    });

    $local.$global.on('com.drdanick.rtoolkit.event.bukkit.SpacecpLoadedEvent', 'rtkapi_connection', function (packet) {
        var oldStatus = $local.$global.status;
        $local.setStatus(4);
    });
    // Runs code that needs to happen if connection is persistent
    $local.$global.on('com.drdanick.rtoolkit.event.WrapperStateChangedEvent', 'rtkapi_connection', function (packet) {
        if (packet.data.oldState === "RESTARTING" && packet.data.newState === "RUNNING") {
            // Wait for SpacecpLoadedEvent, see above
        } else {
            var oldStatus = $local.$global.status;
            $local.setStatus(getStatusInt(packet.data.newState));
        }
    });

    var oldListeners = _.without($local.ee.getListeners(), "connected", "disconnected", "status", "unreached", "error");
    if (oldListeners.length) { // If there were listeners before, re-register them (without the internal listeners)
        oldListeners.forEach(function (lis) {
           var p = new Packet($global.encrypted, $local.key, $local.eventsID, 'registerEventListener', {classes: lis}, '');
            if ($local.$global.connected)
                $local.connection.write(p.compile());
            else
                cb(false);
        });
    }
}

function setStatus (status, force) {
    $local = this;
    var oldStatus = $local.$global.status;
    if (oldStatus !== status || force) {
        $local.$global.status = status;
        $local.ee.emit('status', {oldStatus: oldStatus, newStatus: status});
    }
}


function getStatusInt (statusString) {
     switch (statusString) {
        case 'HELD':
        case 'STOPPED':
            return 2;
        case 'HOLDING':
        case 'STOPPING':
            return 3;
        case 'RUNNING':
            return 4;
        case 'STARTING':
        case 'RESTARTING':
            return 5;
        default:
            return 0;
    }
}








exports.RTKConnection = RTKConnection;
