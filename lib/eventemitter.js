var EventEmitter = require("events").EventEmitter;

var RTKEventEmitter = function () {
	this.l_on = {};
	this.l_once = {};
	EventEmitter.call(this);
};

RTKEventEmitter.prototype = new EventEmitter();

RTKEventEmitter.prototype.on = function (event, token, callback) {
	if(this.l_on[event] && this.l_on[event][token]) {
	    return false;
	} else {
	    if(!this.l_on[event]) {
	        this.l_on[event] =  {};
	    }
	    this.l_on[event][token] = true;
	    switch (event) {
	        case "connected":
	        case "disconnected":
	        case "unreached":
	        case "error":
	        case "status":
	            RTKEventEmitter.prototype.on.call(event, callback);
	        break;
	        default:
	        // This shouldn't happen here and shall be handled by RTKConnection
	            var p = new packet
	                .Packet($global.encrypted, $local.key, $local.eventsid, 'registerEventListener', {classes: event}, '')
	                .compile(function (b) {
	                    if ($global.connected)
	                        $local.connection.write(b);
	                    else
	                        cb(false);
	                });
	            RTKEventEmitter.prototype.on.call(this, event, callback);
	        break;
	    }
	}
};

RTKEventEmitter.prototype.once = function (event, token, callback) {
	
};

RTKEventEmitter.prototype.off = function (event, token) {
	// body...
};

RTKEventEmitter.prototype.removeAllListeners = function (event) {
	// body...
};


exports.RTKEventEmitter = RTKEventEmitter;