var _cluster		= require('cluster');
var _os				= require('os');
var _ 				= require('underscore');
var _datastore 		= require('./lib.datastore').datastore;

var main			= './reporter.js';
var options = {
	timeout:	10000		// if the process doesn't respond after this time, it is killed
}
var i;
var workers				= {};
var cpuCount			= 1;//_os.cpus().length;
_cluster.setupMaster({
    exec:	main
});

console.log(_os.cpus());

//@DEBUG
//cpuCount = 1;

for (var i = 0; i < cpuCount; i++) {
    createWorker();
}

if (_cluster.isMaster) {
	if (options.timeout > 0) {
		setInterval(function() {
			var time = new Date().getTime();
			for (pid in workers) {
				if (workers[pid] && workers[pid].lastCheck + 5000 < time) {
					console.log("TIMEOUT: ", pid);
					workers[pid].worker.process.kill();
					delete workers[pid];
					createWorker();
				}
			}
		}, options.timeout);
	}
}

function createWorker() {
	var worker 	= _cluster.fork();
	console.log("New worker: ",worker.process.pid);
	workers[worker.process.pid] = {
		worker:		worker,
		lastCheck:	new Date().getTime()-1000	// allow boot time
	};
	worker.on('message', function(data) {
		if (workers[worker.process.pid] && workers[worker.process.pid].lastCheck) {
			workers[worker.process.pid].lastCheck = new Date().getTime();
		}
		
	});
	
};

