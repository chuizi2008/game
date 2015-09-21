var http = require('http');
var util = require('util');
var fs = require('fs');
var url = require("url");
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var config = require("./config.json");
var redis = require("./lib/cache");
var OtherManager = require("./Manager/OtherManager");

var sessionTimeout = 10080 * 60;
var n = 0;

if (cluster.isMaster) 
{
	var workerManager = new Array();
	
	// Fork workers.
	for (var i = 0; i < numCPUs; i++) 
		workerManager[i] = cluster.fork();

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
	
	// master进程 接收消息 -> 处理 -> 发送回信
	cluster.on('online', function (worker) 
	{
		// 有worker进程建立，即开始监听message事件
		worker.on('message', function(msg) 
		{
			if (msg == null)
				return;
			
			if (msg.cmd == 'Broadcast' || msg.cmd == 'Login')
			{
				for (var n = 0; n < workerManager.length; n++) 
				{
					try
					{
						workerManager[n].send(msg);
					}
					catch (err)
					{
						console.log(err);
					}
				}
			}
		});
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
	// 初始化数据库连接部分
	redis.ConnectRedis(config.redisIP, 6379, function () 
    {
	    // 初始化战斗模块
	    var serverName = 'chuizi' + process.pid;
	    var TcpServer = require("./fight/TCPServer");
	    var server4Client = new TcpServer(8088, serverName);
	    server4Client.Start(serverName);
		server4Client.WorkerID = cluster.worker.id;
		
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

