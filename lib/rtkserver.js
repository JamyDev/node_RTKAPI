var packet = require('./packet.js'),
    events = require('events'),
    net = require('net'),
    stream = require('stream'),
    _ = require('underscore'),
    crypto = require('crypto');

function RTKServer (info, cb) {
    if(false === (this instanceof RTKServer)) {
        return new RTKServer(info, cb);
    }

    var $this = this;

    if (typeof info === 'object' &&
        typeof info.host === 'string' &&
        typeof info.port === 'number' &&
        typeof info.username === 'string' &&
        typeof info.password === 'string' &&
        typeof info.salt === 'string' || true)
    {
        $this.host = info.host;
        $this.port = info.port;

        var ee = new events.EventEmitter();
        var listeners = {
            l_on: {},
            l_once: {}
        };
        var prevBuff = new Buffer(0);
        var transform;

        $this.errorCount = 0;
        $this.connected = false;
        $this.persistent = false;
        $this.status = 5;
        ee.emit('status', {oldStatus: 0, newStatus: $this.status});


        var connection = net.connect({port: $this.port, host: $this.host, allowHalfOpen: true}, function (con) {
            afterConnect();
        });

        handleConnection();
        process.nextTick(function () {
            ee.emit('status', {oldStatus: $this.status, newStatus: 1});
            $this.status = 1;
        });

        $this.encrypted = (info.encrypted) ? true : false;

        var key;
        if (info.encrypted)
            key = 'secure';
        else
            key = new Buffer(crypto.createHash("sha256").update(info.username+info.password+info.salt).digest("hex"), "hex");

        var eventsid = 1;
        var callsid = 2;

        $this.call = call;
        $this.on = on;
        $this.off = off;
        $this.removeAllListeners = removeAllListeners;
        $this.enablePersistence = enablePersistence;
        $this.disconnect = disconnect;
        $this.reconnect = reconnect;
        $this.getStatus = getStatus;
    }

    function call (method, params, data, cb) {
        callsid += 1;
        var p = new packet
            .Packet($this.encrypted, key, callsid, method, params, data)
            .compile(function (b) {
                ee.once(p.sessionID, cb);
                if ($this.connected)
                    connection.write(b);
                else
                    cb(false);
            });
    }

    function on (event, token, cb) {
        if(listeners.l_on[event] && listeners.l_on[event][token]) {
            return false;
        } else {
            if(!listeners.l_on[event]) {
                listeners.l_on[event] =  {};
            }
            listeners.l_on[event][token] = true;
            switch (event) {
                case "connected":
                case "disconnected":
                case "unreached":
                case "error":
                case "status":
                    ee.on(event, cb);
                break;
                default:
                    var p = new packet
                        .Packet($this.encrypted, key, eventsid, 'registerEventListener', {classes: event}, '')
                        .compile(function (b) {
                            if ($this.connected)
                                connection.write(b);
                            else
                                cb(false);
                        });
                    ee.on(event, cb);
                break;
            }
        }
    }

    function once (event, token, cb) {
        if(listeners.l_once[event] && listeners.l_once[event][token]) {
            return false;
        } else {
            if(!listeners.l_once[event]) {
                listeners.l_once[event] =  {};
            }
            listeners.l_once[event][token] = true;
            switch (event) {
                case "connected":
                case "disconnected":
                case "unreached":
                case "error":
                case "status":
                    ee.once(event, cb);
                break;
                default:
                    $this.call('registerEventListener', {classes: event}, '', cb);
                break;
            }
        }
    }

    function off (event, token, fn) {
        if (listeners.l_on[event] && listeners.l_on[event][token])
            delete listeners.l_on[event][token];
        else if (listeners.l_once[event] && listeners.l_once[event][token])
            delete listeners.l_once[event][token];
        if (getSize(listeners.l_on[event]) === 0 && getSize(listeners.l_once[event]) === 0) {
            var p = new packet
                .Packet($this.encrypted, key, eventsid, 'unregisterEventListener', {classes: event}, '')
                .compile(function (b) {
                    if ($this.connected)
                        connection.write(b);
                    else
                        cb(false);
                });
            ee.removeAllListeners(event);
        }
    }

    function removeAllListeners (event) {
        ee.removeAllListeners(event);
        var p = new packet
            .Packet($this.encrypted, key, eventsid, 'unregisterEventListener', {classes: event}, '')
            .compile(function (b) {
                if ($this.connected)
                    connection.write(b);
                else
                    cb(false);
            });
    }

    function enablePersistence () {
        $this.persistent = true;
        var p = new packet
            .Packet($this.encrypted, key, eventsid, 'enablePersistence', {}, '')
            .compile(function (b) {
                if ($this.connected)
                    connection.write(b);
                else
                    cb(false);
            });
        ee.once(eventsid, afterPersistent);
    }

    function disconnect() {
        ee.emit('status', {oldStatus: $this.status, newStatus: 0});
        $this.status = 0;
        connection.end();
    }

    function reconnect () {
        ee.emit('status', {oldStatus: $this.status, newStatus: 1});
        $this.status = 1;
        connection = net.connect({port: $this.port, host: $this.host, allowHalfOpen: true}, function (con) {
            afterConnect();
        });
        handleConnection();
    }

    function getStatus () {
        return $this.status;
    }

    function handleConnection () {
        connection.on('error', function (e) {
            ee.emit('status', {oldStatus: $this.status, newStatus: 0});
            $this.status = 0;
        });

        connection.on('end', function () {
            if (!$this.connected) {
                ee.emit('unreached', false);
            } else {
                ee.emit('disconnected', false);
            }
            ee.emit('status', {oldStatus: $this.status, newStatus: 0});
            $this.status = 0;
            $this.connected = false;
        });

        connection.on('close', function () {
            if (!$this.connected) {
                ee.emit('unreached', false);
            } else {
                ee.emit('disconnected', false);
            }
            ee.emit('status', {oldStatus: $this.status, newStatus: 0});
            $this.status = 0;
            $this.connected = false;
            $this.errorCount++;
        });
    }
    function afterConnect() {
        createTransform();
        connection.pipe(transform);
        $this.errorCount = 0;
        $this.connected = true;

        ee.emit('status', {oldStatus: $this.status, newStatus: 1});
        $this.status = 1;
        ee.emit('connected');
        cb();
        if ($this.persistent) {
            $this.enablePersistence();
        }
    }

    function afterPersistent () {
        $this.call('getServerState', {}, '', function (p) {
            p.data.newState = p.data.state;
            ee.emit('com.drdanick.rtoolkit.event.WrapperStateChangedEvent', p);
            ee.emit('status', {oldStatus: $this.status, newStatus: getStatusInt(p.data.newState)});
            $this.status = getStatusInt(p.data.newState);
        });
        // Runs code that needs to happen if connection is persistent
        $this.on('com.drdanick.rtoolkit.event.WrapperStateChangedEvent', 'rtkapi_connection', function (packet) {
            var oldStatus = $this.status;
            $this.status = getStatusInt(packet.data.newState);

            ee.emit('status', {oldStatus: oldStatus, newStatus: $this.status});
        });

        var oldListeners = _.without(Object.keys(listeners.l_on), "connected", "disconnected", "status", "unreached", "error");
        if (oldListeners.length) { // If there were listeners before, re-register them (without the internal listeners)
            var p = new packet
            .Packet($this.encrypted, key, eventsid, 'registerEventListener', {classes: oldListeners.join(',')}, '')
            .compile(function (b) {
                if ($this.connected) {
                    connection.write(b);
                }
            });
        }
    }

    function createTransform () {
        transform = new stream.Transform();

        transform._transform = function (data, enc, cb) {
            if (prevBuff.length > 0) {
                data = Buffer.concat([prevBuff, data]);
                prevBuff = new Buffer(0);
            }
            var l = packet.packetLength(data);
            if (data.length === l) {
                try {
                    packet.read(data, function (p) {
                        if (p.error) {
                            return;
                        }
                        if (p.method === "event") {
                            ee.emit(p.params.class, p.clean());
                        } else {
                            ee.emit(p.sessionID, p.clean());
                        }
                    });
                } catch (e) {
                    console.log(e);
                }
                cb();
            } else if (data.length > l) {
                var i = true;
                while (i) {
                    try {
                        packet.read(data.slice(0, l), function (p) {
                            if (p.error) {
                                return;
                            }
                            if (p.method === "event") {
                                ee.emit(p.params.class, p.clean());
                            } else {
                                ee.emit(p.sessionID, p.clean());
                            }
                        });
                    } catch (e) {
                        console.log(e);
                    }

                    data = data.slice(l);
                    l = packet.packetLength(data);
                    if (data.length < l) {
                        if (data.length > 0)
                            prevBuff = data;
                        i = false;
                        cb();
                    }
                }
            } else if (data.length < l) {
                prevBuff = data;
                cb();
            } else {
                // This shouldn't happen
            }
        };

        transform.on('error', function (e) {
            console.log("RTKAPI error "+e);
        });
    }
    return $this;
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



module.exports = RTKServer;