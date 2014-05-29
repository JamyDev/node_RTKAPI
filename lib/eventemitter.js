var EventEmitter = require("events").EventEmitter;
// EVENTEMITTER
var RTKEventEmitter = function (addedCallback, removedCallback) {
    this.l_on = {};
    this.l_once = {};

    this.EventEmitter = new EventEmitter();

    if (addedCallback instanceof Function)
        this.EventEmitter.on('newListener', addedCallback);
    if (removedCallback instanceof Function)
        this.EventEmitter.on('removeListener', removedCallback);

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
            return new Error("Listener with this token already exists: "+token);
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
    }
};

RTKEventEmitter.prototype.once = function (event, token, callback) {
    $class = this;
    if (event === undefined || token === undefined || callback === undefined)
        throw new Error(".once needs 3 parameters: event, token and callback");
    if ($class.l_once[event]) {
        if ($class.l_once[event][token] instanceof Function) {
            return new Error("Listener with this token already exists: "+token);
        } else {
            $class.l_once[event][token] = callback;
        }
    } else {
        $class.l_once[event] = {};
        $class.l_once[event][token] = callback;
    }
    if (event.indexOf("packet_") !== -1) {
        setTimeout(function () {
            if ($class.l_once[event] !== undefined)
                delete $class.l_once[event];
        }, 10000);
    }

    $class.EventEmitter.once(event, function (data) {
        if ($class.l_once[event] && $class.l_once[event][token])
            delete $class.l_once[event][token];
        if (getSize($class.l_on[event]) === 0 && getSize($class.l_once[event]) === 0) {
            delete $class.l_once[event];
            $class.EventEmitter.removeAllListeners(event);
        }
        callback.call(this, data);
    });
};

RTKEventEmitter.prototype.off = function (event, token) {
    if (event === undefined || token === undefined)
        throw new Error(".off needs 2 parameters: event and token");
    if (this.l_on[event] && this.l_on[event][token])
        delete this.l_on[event][token];

    if (getSize(this.l_on[event]) === 0 && getSize(this.l_once[event]) === 0) {
        delete this.l_on[event];
        this.EventEmitter.removeAllListeners(event);
    }
};

RTKEventEmitter.prototype.removeAllListeners = function (event) {
    delete this.l_on[event];
    delete this.l_once[event];
    this.EventEmitter.removeAllListeners(event);
};

RTKEventEmitter.prototype.resetOnceListeners = function () {
    this.l_once = {};
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