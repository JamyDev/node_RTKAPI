#SpaceCP API for Node.JS
This module will allow you to connect to a SpaceCP server with the Node.JS runtime.

This module was produced for the SpaceCP Panel currently being produced by XereoNet.

##Version History

0.5.6-2 Once should now work

0.5.6-1 Fixed access buffer beyond length

0.5.6   try-catches are not how you're supposed to do it

0.5.5   Tramsforms^2

0.5.4   Fixing some more major bugs bunny's

0.5.3-3 That was not a bug of my new code, damn :P

0.5.3-2 Reverted back until I can find the actual fix

0.5.3-1 Bugs gallore

0.5.3   Refactored a lot of code, started adding unit tests

0.5.2-1 Fixed double firing of connect callback

0.5.2   Fixed reconnect

0.5.1   Added re-registring of events after reconnect + Pushed to github

0.4.6   Stuff fixed

0.4.5   Added oldStatus to status event (BREAKING CHANGE!)

0.4.4-4 README.MD fixes

0.4.4-3 Some more fixes

0.4.4-1 Think I fixed double event firing

0.4.4   Streming fixes

0.4.3   STREAM API

0.4.2-1 getServerState

0.4.2   Fixed most bugs

0.4.1-4 Connection error event

0.4.1-3 Reconnect event handlers

0.4.1-2 Reconnect fix

0.4.1-1 Statusses fix

0.4.1   Statusses fix

0.4.0   Multiple listener handler, more statusses

0.3.*   Rewrite, Packet object, status event, disconnect reconnect, etc

0.2.*   Initial Version


##Usage

    var RTKServer = require('./index.js');

    info =  {
        host: 'IP',
        port: 25566,
        username: 'user',
        password: 'pass',
        salt: '',
        encrypted: false
    };


    var s = new RTKServer(info, function () {
        s.enablePersistence();
        s.on('com.drdanick.rtoolkit.event.ConsoleInputEvent', test);
        s.call('ping', {}, '', function (packet) {
            console.log(packet);
        });

        function test (e) {
            console.log(e.data)
        }

        s.off('com.drdanick.rtoolkit.event.ConsoleInputEvent');
    });