var Packet          = require('./packet.js').Packet,
    RTKEventEmitter = require('./eventemitter.js').RTKEventEmitter,
    RTKTransform    = require('./transform.js').RTKTransform,

    Writable        = require("stream").Writable,
    net             = require('net'),
    util            = require('util'),
    _               = require('underscore'),
    crypto          = require('crypto'),
    internalEvents  = ['connected', 'disconnected', 'status', 'unreached', 'error', 'newListener', 'removeListener', 1],
    fn              = function () {},
    packetEvent     = 'packet_';

var RTKConnection = function (info, callback) {
    Writable.call(this, {objectMode: true});
    if(false === (this instanceof RTKConnection)) {
        return new RTKConnection(info, callback);
    }

    var $global = this,
        $local  = {};
        $global = this;

    if (typeof info === 'object' &&
        typeof info.host === 'string' &&
        typeof info.port === 'number' &&
        typeof info.username === 'string' &&
        typeof info.password === 'string' &&
        typeof info.salt === 'string')
    {

        // Global static

        $global.host = info.host;
        $global.port = info.port;
        $global.errorCount = 0;
        $global.connected = false;
        $global.connecting = false;
        $global.persistent = false;
        $global.status = 0;
        $global.encrypted = (info.encrypted) ? true : false;

        // Local static

        $local.key = null;
        $local.eventsID = 1;
        $local.callsID = 2;

        $local.statusInterval = null;

        $local.connectedCB = callback;

        $local.ee = null;
        $local.transform = null;

        $local.WritableEE = {
            on: $global.on,
            once: $global.once,
            removeAllListeners: $global.removeAllListeners
        };

        $local.onError = function (e) {
            console.log("RTKAPI error", e.message, "\n", e.stack);
        };

        $local.WritableEE.on('error', $local.onError);

        

        $local.transform = new RTKTransform();
        $local.transform.on('error', $local.onError);

        
        // Methods...


        $global.connect = function connect () {
            if ($global.connected || $global.connecting)
                return; //throw new Error("Already connected");
            $global.connecting = true;
            $local.setStatus(1);
            $local.connection = net.connect({port: $global.port, host: $global.host, allowHalfOpen: false}, function (con) {
                $global.connecting = false;
                $local.WritableEE.removeAllListeners();
                $local.WritableEE.on('error', $local.onError);
                //$local.transform.removeAllListeners();
                var persistent = $global.persistent;
                $local.connection.pipe($local.transform, {end: false});
                $global.persistent = false;
                $global.connected = true;
                $local.ee.emit('connected');
                if ($local.connectedCB) {
                    $local.connectedCB();
                    $local.connectedCB = false;
                }
                if (persistent)
                    $global.enablePersistence();
            });

            $local.connection.on('error', function (e) {});

            $local.connection.on('end', function () {
                if (!$global.connected)
                    $local.ee.emit('unreached', false);
                else
                    $local.ee.emit('disconnected', false);
                $global.connected = false;
                $global.disconnect();
            });

            $local.connection.on('close', function () {
                if (!$global.connected)
                    $local.ee.emit('unreached', false);
                else
                    $local.ee.emit('disconnected', false);
                $global.connected = false;
                $global.disconnect(true);
            });
        };

        $global.disconnect = function disconnect (error) {
            $global.connecting = false;
            if ($global.connected) {
                $local.connection.end();
                //$local.connection.removeAllListeners();
                $local.connection.unpipe($local.transform);
                $global.connected = false;
            }
            if (!_.isEmpty($local.transform)) {
                //$local.transform.removeAllListeners();
            }
            
            $local.setStatus(0);
            if (error)
                $global.errorCount++;
        };

        $global.reconnect = function reconnect () {
            if ($global.connected)
                $global.disconnect();
            process.nextTick($global.connect);
        };

        $global.getStatus = function getStatus () {
            return $global.status;
        };

        $global.call = function call (method, params, data, cb) {
            if ($global.connected) {
                $local.callsID++;
                if ($local.callsID >= 0x7FFFFFFF)
                    $local.callsID = $local.eventsID+1;
                var p = new Packet($global.encrypted, $local.key, $local.callsID, method, params, data);
                $local.ee.once(packetEvent + p.sessionID, p.sessionID, cb);
                $local.connection.write(p.compile());
            } else
                cb(false);
        };

        $global.enablePersistence = function enablePersistence () {
            if (!$global.persistent) {
                $local.callsID = 2;
                $local.ee.removeAllListeners($local.eventsID);
                $global.persistent = true;
                var p = new Packet($global.encrypted, $local.key, $local.eventsID, 'enablePersistence', {}, '');
                if ($global.connected)
                    $local.connection.write(p.compile());
                $local.ee.once(packetEvent + $local.eventsID, 'rtkapi_enablePersistence', $local.afterPersistent);
            }
        };

        $global.on = function on (event, token, callback) {
            if (token instanceof Function)
                $local.WritableEE.on(event, token);
            else
                $local.ee.on(event, token, callback);
        };

        $global.once = function once (event, token, callback) {
            if (token instanceof Function)
                $local.WritableEE.once(event, token);
            else
                $global.call('registerEventListener', {classes: event}, '', callback);
        };

        $global.off = function off (event, token) {
            $local.ee.off(event, token);
        };

        $global.removeAllListeners = function removeAllListeners (event) {
            $local.ee.removeAllListeners(event);
        };

        $local.newListener = function newListener (event, listener) {
            if (internalEvents.indexOf(event) === -1 && event.toString().indexOf(packetEvent) === -1) {
                var p = new Packet($global.encrypted, $local.key, $local.eventsID, 'registerEventListener', {classes: event}, "");
                if ($global.connected)
                    $local.connection.write(p.compile());
            }
        };

        $local.removeListener = function removeListener (event, listener) {
            if (internalEvents.indexOf(event) === -1 && event.toString().indexOf(packetEvent) === -1) {
                var p = new Packet($global.encrypted, $local.key, $local.eventsID, 'removeEventListener', {classes: event}, "");
                if ($global.connected)
                    $local.connection.write(p.compile());
            }
        };

        $local.afterPersistent = function afterPersistent (packet) {
            $global.call('getServerState', {}, '', function (p) {
                if (p) {
                    p.data.newState = p.data.state;
                    $local.ee.emit('com.drdanick.rtoolkit.event.WrapperStateChangedEvent', p);
                    $local.setStatus(getStatusInt(p.data.newState));
                } else {
                    $global.disconnect();
                }
            });

            $global.on('com.drdanick.rtoolkit.event.bukkit.SpacecpLoadedEvent', 'rtkapi_connection', function (packet) {
                var oldStatus = $global.status;
                $local.setStatus(4);
            });
            // Runs code that needs to happen if connection is persistent
            $global.on('com.drdanick.rtoolkit.event.WrapperStateChangedEvent', 'rtkapi_connection', function (packet) {
                if (packet.data.oldState === "RESTARTING" && packet.data.newState === "RUNNING") {
                    // Wait for SpacecpLoadedEvent, see above
                } else {
                    var oldStatus = $global.status;
                    $local.setStatus(getStatusInt(packet.data.newState));
                }
            });

            if ($local.statusInterval)
                clearInterval($local.statusInterval);

            $local.statusInterval = setInterval(function () {
                $global.call('getServerState', {}, '', function (p) {
                    if (p) {
                        p.data.newState = p.data.state;
                        $local.ee.emit('com.drdanick.rtoolkit.event.WrapperStateChangedEvent', p);
                        $local.setStatus(getStatusInt(p.data.newState));
                    } else {
                        $global.disconnect();
                    }
                });
            }, 3 * 60000);

            var oldListeners = _.difference($local.ee.getListeners(), internalEvents);
            if (oldListeners.length) { // If there were listeners before, re-register them (without the internal listeners)
                oldListeners.forEach(function (lis) {
                   var p = new Packet($global.encrypted, $local.key, $local.eventsID, 'registerEventListener', {classes: lis}, '');
                    if ($global.connected)
                        $local.connection.write(p.compile());
                    else
                        cb(false);
                });
            }
        };

        $local.setStatus = function setStatus (status, force) {
            $local = this;
            var oldStatus = $global.status;
            if (oldStatus !== status || force) {
                $global.status = status;
                this.ee.emit('status', {oldStatus: oldStatus, newStatus: $global.status});
            }
        };

        $local.ee = new RTKEventEmitter($local.newListener, $local.removeListener);

        if (info.encrypted)
            $local.key = 'secure';
        else
            $local.key = new Buffer(crypto.createHash("sha256").update(info.username+info.password+info.salt).digest("hex"), "hex");

        $local.setStatus(0, true);

        $global._write = function (packet, encoding, next) {
            if (packet.method === "event" && packet.sessionID === $local.eventsID) {
                $local.ee.emit(packet.params.class, packet.clean());
            } else {
                $local.ee.emit(packetEvent + packet.sessionID, packet.clean());
            }
            next();
        };
        //$local.transform.removeAllListeners();
        $local.transform.pipe($global, {end: false});

        $global.connect();

        return $global;

    } else {
        callback("Invalid info");
    }

};

util.inherits(RTKConnection, Writable);

//RTKConnection.prototype = new Writable({objectMode: true});




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
