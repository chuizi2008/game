var formidable = require('formidable');
var OtherManager = require("../Manager/OtherManager");
var RedisManager = require("../Manager/RedisManager");
var md5 = require("../lib/md5");
var serverList = new Object();

function Recv(req, res, params) 
{
	// 游戏服务器发送请求连接进行注册操作
	var serverINFO = new Object();
	serverINFO.serverID   = params.query.serverID;
	serverINFO.serverIP   = params.query.serverIP;
	serverINFO.serverPORT = params.query.serverPORT;
	serverINFO.redisIP 	  = params.query.redisIP;
	serverINFO.redisPORT  = params.query.redisPORT;
	serverINFO.pingTime   = Date.now();
	
	// 初始化数据库连接部分
	serverINFO.redis	  = RedisManager.ConnectRedis(serverINFO.redisIP, serverINFO.redisPORT);
	
	// 游戏服务器需要每隔一段时间发送心跳请求给帐号服务器，超过指定时间之后，帐号服务器默认游戏服务器关闭掉了
	serverList[serverINFO.serverID] = serverINFO
	
	console.log('Server:[' + serverINFO.serverID + '] 连接过来了');
}

function GetServerInfo(serverID) 
{
	return serverList[serverID];
}

exports.Recv = Recv;
exports.GetServerInfo = GetServerInfo;