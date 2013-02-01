#SpaceCP API for Node.JS
This module will allow you to connect to a SpaceCP server with the Node.JS runtime.
This module was produced for the SpaceCP Panel currently being produced by XereoNet.

##Usage
```javascript
var scpapi = require('SpaceCP_API');

var server = scpapi.connect(host, port, username, password, salt, secure);


server.on('call', function (data) {
	console.log(data);
	/*
	{ secure: false,
  	sessionid: 1,
  	method: 'testmethod',
  	params: { testkey: 'testval' } }
  */
});

server.call('testmethod', {testkey: 'testval'});