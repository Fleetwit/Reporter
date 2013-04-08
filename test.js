var reporter 		= require('./lib.reporter').reporter;
var _os				= require('os');

var r = new reporter({
	label:		"test",
	onRequest:	function() {
		console.log("return",_os.cpus()[0].times);
		return _os.cpus()[0].times;
	}
});

console.log(_os.cpus());