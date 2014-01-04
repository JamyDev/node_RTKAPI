var RTKServer = require('./index.js');

info =  {
    host: 'localhost',
    port: 25566,
    username: 'user',
    password: 'pass',
    salt: '',
    encrypted: false
};
var s = new RTKServer(info, function () {
    s.enablePersistence();
    s.on('com.drdanick.rtoolkit.event.WrapperConsoleOutputEvent', 'test', function (pack) {
        console.log(pack.data.data);
    }); // Should enable the event

    s.on('com.drdanick.rtoolkit.event.WrapperConsoleOutputEvent', 'test', test); // Should not re-enable the event
    s.on('status', 'test1', function (s) {
        console.log(s);
    });
    s.call('getPlayers', {}, '', function (packet) {
        console.log("Test: ",packet);
    });

    //s.off('com.drdanick.rtoolkit.event.ConsoleInputEvent', 'test', test);
});
