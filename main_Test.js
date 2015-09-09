var http = require('http');
var util = require('util');
var fs = require('fs');
var url = require("url");
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var config = require("./config.json");
var redis = require("./lib/cache");

var sessionTimeout = 10080 * 60;
var n = 0;

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
	var oneSecond = 1000 * 60; // one second = 1000 x 1 ms
	setInterval(function() 
	{
		Ping();
		console.log('Hello there');
	}, oneSecond);
}
else
{
	// 初始化数据库连接部分
	redis.ConnectRedis(config.redisIP, 6379, function () 
    {
	    // 初始化战斗模块
	    var serverName = 'chuizi' + process.pid;
	    var TcpServer = require("./fight/TCPServer");
	    var server4Client = new TcpServer(8088, serverName);
	    server4Client.Start(serverName);
	});
}

function Ping()
{
	var strUrl = "http://" + config.AccountIP + ":" + config.AccountPort + "/RegServer?serverID=" + config.serverID;
	strUrl += "&serverIP=" + config.serverIP + "&serverPORT=" + config.serverPORT;
	strUrl += "&redisIP=" + config.redisIP + "&redisPORT=" + config.redisPORT;

	http.get(strUrl).on('error', function(e) { 
		console.log("帐号服务器连接失败   Got error: " + e.message); 
	});
}

