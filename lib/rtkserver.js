var RTKConnection = require("./rtkconnection.js").RTKConnection;

function RTKServer (info, cb) {
    console.log('RTKServer is deprecated and will probably be removed soon, please start using RTKConnection!');
    
    return new RTKConnection(info, cb);

}

module.exports = RTKServer;
