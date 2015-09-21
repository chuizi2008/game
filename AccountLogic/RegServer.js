var formidable = require('formidable');
var OtherManager = require("../Manager/OtherManager");
var RedisManager = require("../Manager/RedisManager");
var md5 = require("../lib/md5");
var serverList = new Array();
serverList.ServerNum = 0;

function Recv(req, res, params, worker) 
{
	// 游戏服务器发送请求连接进行注册操作
	var serverInfo = new Object();
	serverInfo.serverID   = params.query.serverID;
	serverInfo.serverIP   = params.query.serverIP;
	serverInfo.serverPORT = params.query.serverPORT;
	serverInfo.redisIP 	  = params.query.redisIP;
	serverInfo.redisPORT  = params.query.redisPORT;
	serverInfo.pingTime   = Date.now();

	for (var n = 0; n < worker.length; n++)
	{
		worker[n].send({cmd : "RegServer", params : {serverID : serverInfo.serverID, serverIP : serverInfo.serverIP, serverPORT : serverInfo.serverPORT, redisIP : serverInfo.redisIP, redisPORT : serverInfo.redisPORT}});
	}
	
	if (serverList[serverInfo.serverID] == null)
		serverList.ServerNum++;
	
	// 游戏服务器需要每隔一段时间发送心跳请求给帐号服务器，超过指定时间之后，帐号服务器默认游戏服务器关闭掉了
	serverList[serverInfo.serverID] = serverInfo;
	console.log('Server:[' + serverInfo.serverID + '] 连接过来了');
	
	res.writeHead(200, {'content-type': 'text/html'});
	res.end();

	console.log('服务器在线数: ' + serverList.ServerNum);
}

exports.Recv = Recv;

exports.RegServer = function (params) 
{
	var serverInfo = new Object();
	serverInfo.serverID   = params.serverID;
	serverInfo.serverIP   = params.serverIP;
	serverInfo.serverPORT = params.serverPORT;
	serverInfo.redisIP 	  = params.redisIP;
	serverInfo.redisPORT  = params.redisPORT;
	
	// 初始化数据库连接部分
	serverInfo.redis	  = RedisManager.ConnectRedis(serverInfo.redisIP, serverInfo.redisPORT);
	
	// 游戏服务器需要每隔一段时间发送心跳请求给帐号服务器，超过指定时间之后，帐号服务器默认游戏服务器关闭掉了
	serverList[serverInfo.serverID] = serverInfo;
}

exports.DelServer = function (params) 
{
	var serverInfo = serverList[params.serverID];
	serverInfo.redis.end();
	serverInfo.redis = null;
	serverList[serverInfo.serverID] = null;
	OtherManager.ServerLog(2, "ServerID : " + serverInfo.serverID + "    删除成功");
}

exports.GetServerInfo = function (serverID) 
{
	return serverList[serverID];
}

exports.CheckServer = function (worker)
{
	var timeOut = 2 * 60 * 1000;

	for (var val in serverList)
	{
		var serverInfo = serverList[val];
		if (serverInfo == null)
			continue;
		
		if ((Date.now() - serverInfo.pingTime) > timeOut)
		{
			OtherManager.ServerLog(1, "ServerID : " + serverInfo.serverID + "    超时");
			for (var n = 0; n < worker.length; n++) 
				worker[n].send({cmd : "DelServer", params : {serverID : serverInfo.serverID}});
			serverList[serverInfo.serverID] = null;
			serverList.ServerNum--;
			console.log('服务器在线数: ' + serverList.ServerNum);
		}
	}
}