var _cluster		= require('cluster');
var _os				= require('os');
var _ 				= require('underscore');
var _qs 			= require('querystring');
var _logger 		= require('./lib.logger').logger;
var _datastore 		= require('./lib.datastore').datastore;
var _server 		= require('./lib.simpleserver').simpleserver;
var _stack 			= require('./lib.stack').stack;

var debug_mode		= true;

function reporterServer() {
	var scope 		= this;
	
	this.port		= 8016;
	this.logger 	= new _logger({label:'Reporter:'+process.pid});
	this.clients	= {};		// Active clients on this process (with circular reference)
	this.interval	= {
		update:			5000,	// Request data from clients
		save:			10000	// Save the stack
	};
	this.stack		= [];
	this.init();
};

reporterServer.prototype.init = function() {
	var scope = this;
	scope.mongo = new _datastore({
		database:		"fleetwit"
	});
	scope.mongo.init(function() {
		scope.serverInit();
		scope.timerInit();
	}); 
};
reporterServer.prototype.serverInit = function() {
	var scope = this;
	this.server = new _server(this.port, {
		logger:		this.logger,
		onConnect:	function(client) {
			
		},
		onReceive:	function(client, data) {
			console.log("<"+process.pid+"> Receiving...");
			console.log(data);
			scope.saveData(data);
		},
		onQuit:	function(client) {
			
		}
	});
};
reporterServer.prototype.timerInit = function() {
	var scope = this;
	
	this.timerUpdate = setInterval(function() {
		console.log("<"+process.pid+"> Requesting...");
		scope.server.broadcast({
			update: true
		});
	},this.interval.update);
};
reporterServer.prototype.saveData = function(data) {
	var scope = this;
	
	this.mongo.open("reporter", function(collection) {
		
		var date = new Date();
		
		collection.update(
			{
				dd:		date.getDate(),
				mm:		date.getMonth()+1,
				yyyy:	date.getFullYear()
			},
			{
				$push:	{
					datapoints:	data
				}
			},
			{
				upsert: true
			},
			function() {
				// no need for a callback
			}
		);
		
	});
	
	// empty the stack
	this.stack = [];
};


var instance = new reporterServer();

/************************************/
/************************************/
/************************************/
// Process Monitoring
setInterval(function() {
	process.send({
		memory:		process.memoryUsage(),
		process:	process.pid
	});
}, 1000);

// Crash Management
if (!debug_mode) {
	process.on('uncaughtException', function(err) {
		console.log("uncaughtException",err);
	});
}


