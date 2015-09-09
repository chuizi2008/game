var http = require('http');
var util = require('util');
var fs = require('fs');
var url = require("url");
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var poolModule = require('generic-pool');
var OtherManager = require("./Manager/OtherManager");
var RedisManager = require("./Manager/RedisManager");

var createLogic = require("./AccountLogic/Create");
var loginLogic = require("./AccountLogic/Login");
var regServer = require("./AccountLogic/RegServer");

var port_admin = 8080;
var sessionTimeout = 10080 * 60;
var serverName = "AccountServer";

if (cluster.isMaster) 
{
	// Fork workers.
	for (var i = 0; i < numCPUs; i++) 
	{
		cluster.fork();
	}

	cluster.on('fork', function(worker) 
	{
		worker.send("sessionTimeout=" + sessionTimeout);
	});
	
	cluster.on('exit', function(worker, code, signal) 
	{
		console.log('worker ' + worker.process.pid + ' died, restart');
		// 一旦工作进程崩了，自动重启
		cluster.fork();			
	});
}
else
{
	CreateServer(serverName);
}

function CreateServer(serverName)
{
	//用http模块创建一个http服务端 
	var httpServer = http.createServer(function(req, res)
	{
		try
		{
			var params = url.parse(req.url, true);
			console.log(params.pathname);
			if (params.pathname == "/Login")
				loginLogic.Recv(req, res, params);
			else if (params.pathname == "/Create")
				createLogic.Recv(req, res, params);
			else if (params.pathname == "/RegServer")
				regServer.Recv(req, res, params);
		}
		catch(e)
		{
			console.log(e);
		}
	});

	httpServer.timeout = 15000;
	httpServer.maxConnections = 5000;
	httpServer.on("clientError", function(err, stack) 
	{
		OtherManager.ServerLog(3, "[" + serverName + "] HTTP_ClientError : " + err, stack);
	});
	httpServer.on("error", function(err, stack) 
	{
	    OtherManager.ServerLog(3, "[" + serverName + "] HTTP_ServerError : " + err, stack);
	});
	httpServer.on("listening", function() {
	    OtherManager.ServerLog(1, "[" + serverName + "] listening on http://localhost:" + port_admin);
	});
	httpServer.listen(port_admin, "0.0.0.0");
}


