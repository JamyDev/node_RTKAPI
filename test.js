var RTKConnection = require('./index.js').RTKConnection;

var info =  {
    host: 'localhost',
    port: 25566,
    username: 'spacecp',
    password: 'spacecp',
    salt: 'E9tR0dw78FnQ3VY6qYVXhMOAGwYakhbrJBcZOQjltnVBQgRbCqZ1QJGkx2hqZa6',
    encrypted: false
};
var s = new RTKConnection(info, function () {
    console.log("asdf")
    s.call("wow", {}, "[]", function (res) {
        console.log(res)
    })
    // s.enablePersistence();
    // s.on('com.drdanick.rtoolkit.event.WrapperConsoleOutputEvent', 'test', function (pack) {
    //     console.log(pack.data.data);
    // }); // Should enable the event

    // //s.on('com.drdanick.rtoolkit.event.WrapperConsoleOutputEvent', 'test', test); // Should not re-enable the event
    // s.on('status', 'test1', function (s) {
    //     console.log(s);
    // });
    // s.call('getPlayers', {}, '', function (packet) {
    //     console.log("Test: ",packet);
    // });

    //s.off('com.drdanick.rtoolkit.event.ConsoleInputEvent', 'test', test);
});

setInterval(console.log, 5000, "Hi")