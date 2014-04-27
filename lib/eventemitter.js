var EventEmitter = require("events").EventEmitter;

var RTKEventEmitter = function () {
	this.l_on = {};
	this.l_once = {};

	this.EventEmitter = new EventEmitter();

};

RTKEventEmitter.prototype.emit = function (event, data) {
	this.EventEmitter.emit(event, data);
};

RTKEventEmitter.prototype.on = function (event, token, callback) {
	var $class = this;

	if (event === undefined || token === undefined || callback === undefined)
		throw new Error(".on needs 3 parameters: event, token and callback");
	if ($class.l_on[event]) {
		if ($class.l_on[event][token] instanceof Function) {
			throw new Error("Listener with ths token already exists: "+token);
		} else {
			$class.l_on[event][token] = callback;
		}
	} else {
		$class.l_on[event] = {};
		$class.l_on[event][token] = callback;
		$class.EventEmitter.on(event, function (data) {
			Object.keys($class.l_on[event]).forEach(function (t) {
				process.nextTick($class.l_on[event][t].bind(this, data));
			});
		});
		// Send registerEvent to RTK
	}
};

RTKEventEmitter.prototype.once = function (event, token, callback) {
	$class = this;
	if (event === undefined || token === undefined || callback === undefined)
		throw new Error(".once needs 3 parameters: event, token and callback");
	if ($class.l_once[event]) {
		if ($class.l_once[event][token] instanceof Function) {
			throw new Error("Listener with ths token already exists: "+token);
		} else {
			$class.l_once[event][token] = callback;
		}
	} else {
		$class.l_once[event] = {};
		$class.l_once[event][token] = callback;
	}

	$class.EventEmitter.once(event, function (data) {
		if ($class.l_once[event] && $class.l_once[event][token])
		    delete $class.l_once[event][token];
		if (getSize($class.l_on[event]) === 0 && getSize($class.l_once[event]) === 0)
			$class.EventEmitter.removeAllListeners(event);

		callback.call(this, data);
	});

	if (getSize($class.l_on[event]) === 0 && getSize($class.l_once[event]) === 0) {
		// Send registerListener to rtk	
	}
};

RTKEventEmitter.prototype.off = function (event, token) {
	if (event === undefined || token === undefined)
		throw new Error(".off needs 2 parameters: event and token");
	if (this.l_on[event] && this.l_on[event][token])
	    delete this.l_on[event][token];
	
	if (getSize(this.l_on[event]) === 0 && getSize(this.l_once[event]) === 0) {
	    // var p = new packet
	    //     .Packet($global.encrypted, $local.key, $local.eventsid, 'removeEventListener', {classes: event}, '')
	    //     .compile(function (b) {
	    //         if ($global.connected)
	    //             $local.connection.write(b);
	    //         else
	    //             cb(false);
	    //     });
	    this.EventEmitter.removeAllListeners(event);
	}
};

RTKEventEmitter.prototype.removeAllListeners = function (event) {
	delete this.l_on[event];
	delete this.l_once[event];
    this.EventEmitter.removeAllListeners(event);
	// Fire toolkit deregister message
};

RTKEventEmitter.prototype.getListeners = function () {
	return Object.keys(this.l_on);
};


function getSize(obj) {
	if (obj instanceof Object)
    	return Object.keys(obj).length;
    else if (obj instanceof Array)
    	return obj.length;
    else
    	return 0;
}


exports.RTKEventEmitter = RTKEventEmitter;