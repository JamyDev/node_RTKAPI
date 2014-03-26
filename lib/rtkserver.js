var packet = require('./packet.js'),
    events = require('events'),
    stream = require('stream'),
    net = require('net'),

    _ = require('underscore'),
    crypto = require('crypto');

function RTKServer (info, cb) {
    if(false === (this instanceof RTKServer)) {
        return new RTKServer(info, cb);
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
        $global.status = 5;
        $global.encrypted = (info.encrypted) ? true : false;

        // Local
        $local.ee = new events.EventEmitter();
        $local.listeners = {
            l_on: {},
            l_once: {}
        };
        $local.prevBuff = new Buffer(0);
        $local.transform = null;
        $local.key = "";
        $local.eventsid = 1;
        $local.callsid = 2;


        $local.ee.emit('status', {oldStatus: 0, newStatus: $global.status});


        $local.connection = net.connect({port: $global.port, host: $global.host, allowHalfOpen: true}, function (con) {
            afterConnect();
        });

        handleConnection();
        process.nextTick(function () {
            $local.ee.emit('status', {oldStatus: $global.status, newStatus: 1});
            $global.status = 1;
        });



        if (info.encrypted)
            $local.key = 'secure';
        else
            $local.key = new Buffer(crypto.createHash("sha256").update(info.username+info.password+info.salt).digest("hex"), "hex");


        $global.call = call;
        $global.on = on;
        $global.off = off;
        $global.removeAllListeners = removeAllListeners;
        $global.enablePersistence = enablePersistence;
        $global.disconnect = disconnect;
        $global.reconnect = reconnect;
        $global.getStatus = getStatus;

    } else {
        cb("Invalid info");
    }

    function call (method, params, data, cb) {
        $local.callsid += 1;
        var p = new packet
            .Packet($global.encrypted, $local.key, $local.callsid, method, params, data)
            .compile(function (b) {
                $local.ee.once(p.sessionID, cb);
                if ($global.connected)
                    $local.connection.write(b);
                else
                    cb(false);
            });
    }

    function on (event, token, cb) {
        if($local.listeners.l_on[event] && $local.listeners.l_on[event][token]) {
            return false;
        } else {
            if(!$local.listeners.l_on[event]) {
                $local.listeners.l_on[event] =  {};
            }
            $local.listeners.l_on[event][token] = true;
            switch (event) {
                case "connected":
                case "disconnected":
                case "unreached":
                case "error":
                case "status":
                    $local.ee.on(event, cb);
                break;
                default:
                    var p = new packet
                        .Packet($global.encrypted, $local.key, $local.eventsid, 'registerEventListener', {classes: event}, '')
                        .compile(function (b) {
                            if ($global.connected)
                                $local.connection.write(b);
                            else
                                cb(false);
                        });
                    $local.ee.on(event, cb);
                break;
            }
        }
    }

    function once (event, token, cb) {
        if($local.listeners.l_once[event] && $local.listeners.l_once[event][token]) {
            return false;
        } else {
            if(!$local.listeners.l_once[event]) {
                $local.listeners.l_once[event] =  {};
            }
            $local.listeners.l_once[event][token] = true;
            switch (event) {
                case "connected":
                case "disconnected":
                case "unreached":
                case "error":
                case "status":
                    $local.ee.once(event, cb);
                break;
                default:
                    $global.call('registerEventListener', {classes: event}, '', cb);
                break;
            }
        }
    }

    function off (event, token, fn) {
        if ($local.listeners.l_on[event] && $local.listeners.l_on[event][token])
            delete $local.listeners.l_on[event][token];
        else if ($local.listeners.l_once[event] && $local.listeners.l_once[event][token])
            delete $local.listeners.l_once[event][token];
        if (getSize($local.listeners.l_on[event]) === 0 && getSize($local.listeners.l_once[event]) === 0) {
            var p = new packet
                .Packet($global.encrypted, $local.key, $local.eventsid, 'removeEventListener', {classes: event}, '')
                .compile(function (b) {
                    if ($global.connected)
                        $local.connection.write(b);
                    else
                        cb(false);
                });
            $local.ee.removeAllListeners(event);
        }
    }

    function removeAllListeners (event) {
        $local.ee.removeAllListeners(event);
        var p = new packet
            .Packet($global.encrypted, $local.key, $local.eventsid, 'removeEventListener', {classes: event}, '')
            .compile(function (b) {
                if ($global.connected)
                    $local.connection.write(b);
                else
                    cb(false);
            });
    }

    function enablePersistence () {
        if (!$global.persistent) {
            $global.persistent = true;
            var p = new packet
                .Packet($global.encrypted, $local.key, $local.eventsid, 'enablePersistence', {}, '')
                .compile(function (b) {
                    if ($global.connected)
                        $local.connection.write(b);
                    else
                        cb(false);
                });
            $local.ee.once($local.eventsid, afterPersistent);
        }
    }

    function disconnect() {
        $local.ee.emit('status', {oldStatus: $global.status, newStatus: 0});
        $global.status = 0;
        $local.connection.end();
    }

    function reconnect () {
        $local.ee.emit('status', {oldStatus: $global.status, newStatus: 1});
        $global.status = 1;
        $local.connection = net.connect({port: $global.port, host: $global.host, allowHalfOpen: true}, function (con) {
            afterConnect();
        });
        handleConnection();
    }

    function getStatus () {
        return $global.status;
    }

    function handleConnection () {
        $local.connection.on('error', function (e) {
            $local.ee.emit('status', {oldStatus: $global.status, newStatus: 0});
            $global.status = 0;
        });

        $local.connection.on('end', function () {
            if (!$global.connected) {
                $local.ee.emit('unreached', false);
            } else {
                $local.ee.emit('disconnected', false);
            }
            $local.ee.emit('status', {oldStatus: $global.status, newStatus: 0});
            $global.status = 0;
            $global.connected = false;
        });

        $local.connection.on('close', function () {
            if (!$global.connected) {
                $local.ee.emit('unreached', false);
            } else {
                $local.ee.emit('disconnected', false);
            }
            $local.ee.emit('status', {oldStatus: $global.status, newStatus: 0});
            $global.status = 0;
            $global.connected = false;
            $global.errorCount++;
        });
    }
    function afterConnect(persistent) {
        $local.transform = constructTransform();
        $local.connection.pipe($local.transform);
        $global.errorCount = 0;
        $global.persistent = false;
        $global.connected = true;

        $local.ee.emit('status', {oldStatus: $global.status, newStatus: 1});
        $global.status = 1;
        $local.ee.emit('connected');
        cb(false);
        if (persistent) {
            $global.enablePersistence();
        }
    }

    function afterPersistent () {
        $global.call('getServerState', {}, '', function (p) {
            p.data.newState = p.data.state;
            $local.ee.emit('com.drdanick.rtoolkit.event.WrapperStateChangedEvent', p);
            $local.ee.emit('status', {oldStatus: $global.status, newStatus: getStatusInt(p.data.newState)});
            $global.status = getStatusInt(p.data.newState);
        });

        $global.on('com.drdanick.rtoolkit.event.bukkit.SpacecpLoadedEvent', 'rtkapi_connection', function (packet) {
            var oldStatus = $global.status;
            $global.status = 4;
            $local.ee.emit('status', {oldStatus: oldStatus, newStatus: $global.status});
        })
        // Runs code that needs to happen if connection is persistent
        $global.on('com.drdanick.rtoolkit.event.WrapperStateChangedEvent', 'rtkapi_connection', function (packet) {
            if (packet.data.oldState === "RESTARTING" && packet.data.newState === "RUNNING") {
                // Wait for SpacecpLoadedEvent, see above
            } else {
                var oldStatus = $global.status;
                $global.status = getStatusInt(packet.data.newState);
                $local.ee.emit('status', {oldStatus: oldStatus, newStatus: $global.status});
            }
        });

        var oldListeners = _.without(Object.keys($local.listeners.l_on), "connected", "disconnected", "status", "unreached", "error");
        if (oldListeners.length) { // If there were listeners before, re-register them (without the internal listeners)
            oldListeners.forEach(function (lis) {
               var p = new packet
               .Packet($global.encrypted, $local.key, $local.eventsid, 'registerEventListener', {classes: lis}, '')
                .compile(function (b) {
                   if ($global.connected) {
                       $local.connection.write(b);
                   }
               });
            });

        }
    }

    function constructTransform() {

        var transform = new stream.Transform();

        $local.prevBuff = new Buffer(0);

        transform._transform = function (data, enc, cb) {
            if ($local.prevBuff.length > 0) { // Check for previously unparsed data
                data = Buffer.concat([$local.prevBuff, data]);
                $local.prevBuff = new Buffer(0);
            }
            var l = packet.packetLength(data);
            if (data.length === l) {
                try {
                    packet.read(data, function (p) {
                        if (p.error) {
                            return;
                        }
                        if (p.method === "event") {
                            $local.ee.emit(p.params.class, p.clean());
                        } else {
                            $local.ee.emit(p.sessionID, p.clean());
                        }
                    });
                } catch (e) {
                    console.trace("RTKAPI: Error reading packet in transform", e);
                }
                cb();
            } else if (data.length > l) {
                var i = true;
                while (i) {
                    packet.read(data.slice(0, l), function (p) {
                        if (p.error) {
                            return;
                        }
                        if (p.method === "event") {
                            $local.ee.emit(p.params.class, p.clean());
                        } else {
                            $local.ee.emit(p.sessionID, p.clean());
                        }
                    });

                    data = data.slice(l);
                    l = packet.packetLength(data);
                    if (data.length < l) {
                        if (data.length > 0)
                            $local.prevBuff = data;
                        i = false;
                        cb();
                    }
                }
            } else if (data.length < l) {
                $local.prevBuff = data;
                cb();
            } else {
                // This shouldn't happen
            }
        };

        transform.on('error', function (e) {
            console.log("RTKAPI: Error parsing data",e);
        });

        return transform;
    }

    return $global;

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

function getSize(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
}

module.exports = RTKServer;
