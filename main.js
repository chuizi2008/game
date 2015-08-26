var http = require('http');
var util = require('util');
var fs = require('fs');
var url = require("url");
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var OtherManager = require("./Manager/OtherManager");

var port_admin = 8080;
var sessionTimeout = 10080 * 60;

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
	var FileManager = require("./Manager/FileManager");
	var redis = require("./lib/cache");

	// 初始化数据库连接部分
	redis.ConnectRedis("192.168.0.35", 6379, function () 
    {
	    // 初始化战斗模块
	    var serverName = 'chuizi' + process.pid;
	    var TcpServer = require("./fight/TCPServer");
	    var server4Client = new TcpServer(8088, serverName);
	    server4Client.Start(serverName);

	    CreateServer(serverName);
	});
}

function CreateServer(serverName)
{
	//用http模块创建一个http服务端 
	var httpServer = http.createServer(function(req, res)
	{
		try
		{
			var params = url.parse(req.url, true);//解释url参数部分name=zzl&email=zzl@sina.com
			var ret = OtherManager.JumpLogic(req, res, params);
			if (ret == 1)
				return;
			
			if (req.url == "/favicon.ico")
				return;

			// 最开始是管理器部分
			if (req.url == "/UpFile")
			{
				FileManager.UpFile(req, res);
				return;
			}
			else if (req.url.indexOf("/GetFile=") >= 0 )
			{
				FileManager.GetFile(req, res);
				return;
			}
			else if (req.url.indexOf("/GetFileEX=") >= 0 )
			{
				FileManager.GetFileEX(req, res);
				return;
			}
			
			// OtherManager.JumpPage(req.method.toLowerCase() == 'post', req, res, req.url);
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


