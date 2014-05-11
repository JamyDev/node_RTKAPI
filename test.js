var RTKConnection = require("./lib/rtkconnection.js").RTKConnection;
var RTKTransform = require("./lib/transform.js").RTKTransform;
var Packet = require("./lib/packet.js").Packet;
var net = require('net');
var ex = {};
ex.transform = null;
    ex.server = net.createServer(function (con) {
        ex.transform = new RTKTransform();
        //ex.transform.removeAllListeners();
        con.pipe(ex.transform);
        // ex.transform.on('data', function (p) {
        //     if (p.method === 'enablePersistence')
        //         con.write((new Packet(false, "0000000000000000000000000000000000000000000000000000000000000000", p.sessionID, "apiNotice", {}, "persistenceEnabled", null, 0x01, false)).compile());
        //     else if (p.method === "getServerState")
        //         con.write((new Packet(false, "0000000000000000000000000000000000000000000000000000000000000000", p.sessionID, "apiNotice", {}, JSON.stringify({state: "RUNNING"}), null, 0x01, false)).compile());
        //     //console.log(JSON.stringify(p));
        //     // else
        //     //  console.log("unknownp", p);
        // });
        
    });
    
    ex.server.listen(25566);

// var RTKConnection = require('./index.js');

// var info =  {
//     host: 'localhost',
//     port: 25566,
//     username: 'username',
//     password: 'password',
//     salt: 'randomdatagoeshere',
//     encrypted: false
// };

// // Instantiate a new connection
// var c = new RTKConnection(info, function () {
//     // If we want to do more than one call per connection we need to enable the persistence with this method
//     c.enablePersistence();

//     // Now that persistence is enabled we can call a method (This one is from the SpaceCP module so it won't work on a clean RTK)
//     c.call("getPlayers", {}, "[]", function (res) {
//         console.log(res.data);
//     });

//     // Events can also be listened to, to do this we use the .on method
//     // There are 3 parameters, the event, the token for this listener and the callback function
//     c.on('com.drdanick.rtoolkit.event.WrapperConsoleOutputEvent', 'test', function (pack) {
//         // This will log each console line that gets sent (Default in RTK)
//         console.log(pack.data.data);
//     });

//     // To remove an event listener, we use .off with the event and the token
//     c.off('com.drdanick.rtoolkit.event.WrapperConsoleOutputEvent', 'test');

//     // More methods are available too, check the $global object in ./lib/rtkconnection.js
// });
