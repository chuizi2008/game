var http = require('http');
var util = require('util');
var fs = require('fs');
var url = require("url");
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var OtherManager = require("./Manager/OtherManager");
var config = require("./config.json");

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
	
	// 设置时间回调，确保每隔一分钟，发送心跳请求给帐号服务器，注册自己
	Ping();
	var oneSecond = 1000 * 60 * 1; // one second = 1000 x 1 ms
	setInterval(function() 
	{
		Ping();
	}, oneSecond);
}
else
{
	var FileManager = require("./Manager/FileManager");
	var redis = require("./lib/cache");

	// 初始化数据库连接部分
	redis.ConnectRedis(config.redisIP, config.redisPORT, function () 
    {
	    // 初始化战斗模块
	    var serverName = 'chuizi' + process.pid;
	    var TcpServer = require("./fight/TCPServer");
	    var server4Client = new TcpServer(config.clientPORT, serverName);
	    server4Client.Start(serverName);
		
		// 父进程的刷新服务器配置消息
		process.on('message', function(msg) 
		{
			if (msg.cmd == 'Broadcast')
				server4Client.Broadcast(msg.type, msg.account, msg.info);
			else if (msg.cmd == 'Login')
				server4Client.CheckLogin(msg);
		});
		
		var oneSecond = 1000 * 20 * 1; // one second = 1000 x 1 ms
		setInterval(function() 
		{
			server4Client.ShowOnlineNum();
		}, oneSecond);
	});
}
function Ping()
{
	var strUrl = "http://" + config.AccountIP + ":" + config.AccountPort + "/RegServer?serverID=" + config.serverID;
	strUrl += "&serverIP=" + config.serverIP + "&serverPORT=" + config.serverPORT;
	strUrl += "&redisIP=" + config.redisIP + "&redisPORT=" + config.redisPORT;

	// 我对下面这种写法感觉好恶心~~~
	http.get(strUrl, function(res)
	{                                                                                                                      
		res.on('data', function(chunk)
		{
			// get之后的数据返回
		}).on('error', function(err)
		{
			console.log("帐号服务器连接失败   Got error: " + err); 
		}).on('end', function()
		{
			console.log("帐号服务器Ping成功"); 
		});
	}).on('error', function(err) {
		console.log("帐号服务器连接失败   Got error: " + err); 
	});
}


