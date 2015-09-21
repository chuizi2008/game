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

var port_client = 8080;
var port_server = 8880;
var sessionTimeout = 10080 * 60;
var serverName = "AccountServer";

if (cluster.isMaster) 
{
	var worker = new Array();
	
	// Fork workers.
	for (var i = 0; i < numCPUs; i++)
		worker[i] = cluster.fork();

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
	
	// 每隔指定时间，检测服务器连接情况
	var oneSecond = 1000 * 10; // one second = 1000 x 1 ms
	setInterval(function() 
	{
		regServer.CheckServer(worker);
	}, oneSecond);
	
	CreateServerManager(regServer, worker);
}
else
{
	CreateServer(serverName);
}

function CreateServerManager(regServer, worker)
{
	var regServer = require("./AccountLogic/RegServer");
	
	//用http模块创建一个http服务端 
	var httpServer = http.createServer(function(req, res)
	{
		var params = url.parse(req.url, true);
		if (params.pathname == "/RegServer")
		{
			regServer.Recv(req, res, params, worker);
			regServer.CheckServer();
		}
	});

	httpServer.timeout = 15000;
	httpServer.maxConnections = 5000;
	httpServer.on("clientError", function(err, stack) 
	{
		OtherManager.ServerLog(3, "[ServerManager] HTTP_ClientError : " + err, stack);
	});
	httpServer.on("error", function(err, stack) 
	{
	    OtherManager.ServerLog(3, "[ServerManager] HTTP_ServerError : " + err, stack);
	});
	httpServer.on("listening", function() {
	    OtherManager.ServerLog(1, "[ServerManager] listening on http://localhost:" + port_server);
	});
	httpServer.listen(port_server, "0.0.0.0");
}

function CreateServer(serverName)
{
	// 父进程的刷新服务器配置消息
	process.on('message', function(msg) 
	{
		if (msg.cmd == 'RegServer') 
			regServer.RegServer(msg.params);
		else if (msg.cmd == 'DelServer') 
			regServer.DelServer(msg.params);
	});
	
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
	    OtherManager.ServerLog(1, "[" + serverName + "] listening on http://localhost:" + port_client);
	});
	httpServer.listen(port_client, "0.0.0.0");
}


