var lua = require('./hello.node');
var uuid = require('node-uuid');
var net = require('net');
var osutil = require('../lib/osutil');
var redis = require("../lib/cache");

// 包大小[2] + 包消息标识[2] + 包实际内容[0x0FFF]
var MsgHeadSize = 4;
var MsgBodySize = 0x0FFF;
var MsgMaxSize = MsgHeadSize + MsgBodySize;

// 心跳包相关
var heartBeatCheckTime = 7000;
var heartBeatIndexMax = 0x7FFF;
var heartBeatMsgID = 0xFFFF;

function TcpServer(nPort, name)
{
	if (lua.StartLua() != 1)
		console.log('lua init err');
	else
	{
		lua.SetMsgCallback('SysOutLog', function(info){ console.log(info); });
		var ret = this.RefreshScript()
		if (ret == 1)
			console.log('lua init ok');
		else
			console.log('lua init failure');
	}

	this.port = nPort;
	this.serverName = name;
	this.msgHandler = null;
	this.connCB = null;
	this.connBrokenCB = null;
	this.connects = {};
}

TcpServer.prototype.RefreshScript = function ()
{
	if (!lua.DoFile('./fight/LuaScripts/Main.lua', function(info){ console.log(info); })) return 0;
	if (!lua.DoFile('./fight/LuaScripts/Scan.lua')) return 0;
	if (!lua.DoFile('./fight/LuaScripts/Test.lua')) return 0;
		
	return 1;
}

TcpServer.prototype.DisconnectAccount = function (account)
{
	var myself = this;
	
	if (myself.ClientTable[account] != null)
	{
		myself.ClientTable[account].destroy();
		myself.ClientTable[account] = null;
	}
}

TcpServer.prototype.ServerLog = function(serverName, str)
{
	osutil.ServerLog("pid: " + process.pid + "  [" + serverName + "]   " + str);
}

TcpServer.prototype.SendMsg = function(client, msgID, msg)
{
}

TcpServer.prototype.SendErrInfo = function(client, info)
{
	var json = JSON.stringify(info);
	var msgLen = json.length;
	if (msgLen > MsgBodySize)
		return;
	
	var offSet = 0;
	var sendBuffer = new Buffer(MsgHeadSize + msgLen);
	sendBuffer.writeUInt16LE(msgLen, offSet); offSet += 2;
	sendBuffer.writeUInt16LE(msgID,  offSet); offSet += 2;
	sendBuffer.write(json, offSet, msgLen);
	
	client.write(sendBuffer, 'utf-8', function()
	{
		client.end();
	});
}

TcpServer.prototype.broadcast = function(obj)
{
	var myself = this;
}

TcpServer.prototype.Login = function(client, obj)
{
	var myself = this;
	var nOffset = 0;
	
	osutil.ServerLog(obj.toString());
	
	var len = obj.readUInt16LE(nOffset);
	nOffset += 2;
	var Account = obj.toString('utf8', nOffset, nOffset + len);
	nOffset += len;
	
	console.log("len == " + len + " || Account == " + Account);
	
	len = obj.readUInt16LE(nOffset);
	nOffset += 2;
	var LoginKey = obj.toString('utf8', nOffset, nOffset + len);
	nOffset += len;
	
	console.log("len == " + len + " || LoginKey == " + LoginKey);
	
	if (Account == null || LoginKey == null)
	{
		console.log("obj.Account == null || obj.LoginKey == null");
		myself.SendErrInfo(client, {info:"Account == null || LoginKey == null"});
		client.destroy();
		return;
	}
		
	redis.GetCache().hget('account', 'acc_' + Account, function (error, responseObj) 
	{
		if (error)
		{
			console.log(error);
			client.destroy();
			return;
		}
		
		var bufferTemp = new Buffer(responseObj);
		
		if (redis.IsNullOrEmpty(responseObj))
		{
			console.log('this is big bug');
			client.destroy();
			return;
		}
		
		var roleObj = JSON.parse(responseObj);
		
		console.log("C:account:" + Account     + "|LoginKey:" + LoginKey);
		console.log("S:account:" + roleObj.Account + "|LoginKey:" + roleObj.LoginKey);
		
		// 判断登录标记
		if (roleObj.Account != Account || roleObj.LoginKey != LoginKey)
		{
			console.log("Account: " + Account + "  LoginKey err");
			client.destroy();
			return;
		}

		myself.DisconnectAccount(roleObj.Account);

		myself.ClientTable[roleObj.Account] = client;
		
		client.roleObj = roleObj;
		
		var sendBuffer = new Buffer(MsgHeadSize + 4);
		sendBuffer.writeUInt16LE(4, 0);
		sendBuffer.writeUInt16LE(1111, 2);
		sendBuffer.writeUInt16LE(1, 4);
		client.write(sendBuffer, 'utf-8');
	
	/*
		socket.broadcast.emit('broadcast message', {content:'Account:' + roleObj.Account + '进入游戏'});
		console.log('login Account:' + roleObj.Account + '       LoginKey:' + roleObj.LoginKey);
		socket.emit('loginRet', {content:"Y"});*/
	});
}

// 开启服务
TcpServer.prototype.Start = function()
{
	var server = net.createServer();
	var myself = this;
	myself.ClientTable = [];
	
	server.on('error', function(e){
		myself.ServerLog(myself.serverName, "server error, error code: " + e.code);
	});

	server.on('close', function() {
		myself.ServerLog(myself.serverName, "server close");
	});

	server.on('listening', function() {
		myself.ServerLog(myself.serverName, "server listen on the port: " + myself.port);
	})

	server.on('connection', function(client){
		osutil.ServerLog("client connected, ip:" + client.remoteAddress);
/*
		var netId = uuid.v1();
		var session = {};
		session.netId = netId;
		session.socket = client;
		session.address = client.remoteAddress;
		session.heartbeatIndex = 0;
		myself.connects[netId] = session;*/

		client.on('close', function() 
		{
			osutil.ServerLog("client closed, ip:" + client.remoteAddress);
			//DisconnectAccount(client.Account);
			//delete myself.connects[netId];
			//myself.connBrokenCB(netId);
			//clearTimeout(session.timer);
            //osutil.UpdateMatchmakingServerForEndTime(netId); 数据库记录登出日志
		});

		client.on('error', function() {
			osutil.ServerLog(myself.serverName + ": client error, ip:" + client.remoteAddress);
		});

		client.on('drain', function() {
			osutil.ServerLog(myself.serverName + ": send data end, ip:" + client.remoteAddress);
		});

        //存储数据
		var bufferTemp = new Buffer(0);
		var index = 0;
		
		// 接收数据
		client.on('data', function(data) 
		{
			// 这个TCP并不像以往C++那种SOCKET，是不分包的，对的就是不分包，需要自己组装，拆分
			// 应该说是流方式
			osutil.ServerLog("data.length = " + data.length);
			
			var receiveBuffer = new Buffer(bufferTemp.length + data.length);
			if(bufferTemp.length > 0)
			{
				bufferTemp.copy(receiveBuffer, 0 ,0, bufferTemp.length);
				data.copy(receiveBuffer, bufferTemp.length, 0, data.length);
			}
			else
			{
		   		data.copy(receiveBuffer, 0, 0, data.length);
		   	}
			
			var nOffset = 0;
			var nDataLen = receiveBuffer.length;
			while (true)
			{
				// 异常
				if (nDataLen <= 0)
				{
					bufferTemp = new Buffer(0);
					break;
				}
					
				// 小于最小包标准，就是只有包头
				if (nDataLen < MsgHeadSize)
				{
					bufferTemp = new Buffer(nDataLen);
					receiveBuffer.copy(bufferTemp, 0, nOffset, nOffset + nDataLen);
					break;
				}

				// 包内容超过标准
				var nMsgSize = receiveBuffer.readUInt16LE(nOffset);
				if (nMsgSize > MsgBodySize)
				{
					bufferTemp = new Buffer(0);
					break;
				}
				
				osutil.ServerLog("nMsgSize = " + nMsgSize);

				// 包大小不完全，等待下一个内容
				if(nMsgSize > nDataLen)
				{
					bufferTemp = new Buffer(nDataLen);
					receiveBuffer.copy(bufferTemp, 0, nOffset, nOffset + nDataLen);
					break;
				}
					
				// 跳过包大小定义
				nOffset += 2;
				nDataLen -= 2;
				
				// 包消息类型定义
				var nMsgID = receiveBuffer.readUInt16LE(nOffset);
				nOffset += 2;
				nDataLen -= 2;
				
				osutil.ServerLog("nMsgID = " + nMsgID);
				
				// 心跳包
				if(nMsgID == heartBeatMsgID)
				{
					/*
					var heartbeatIndex = receiveBuffer.readUInt16LE(nOffset);
					if(session.heartbeatIndex == heartbeatIndex)
					{
						session.heartbeatBack = 1;
					}
					else
					{
						session.socket.end();
                        delete myself.connects[session.netId];
                        myself.connBrokenCB(session.netId);
                        clearTimeout(session.timer);
						osutil.ServerLog("on data:heart beat failed, return back error, netId=" + netId + ", ip=" + session.address);
					}*/
				}
				// 消息逻辑包
				else
				{
					var bufferRecv = new Buffer(nMsgSize);
					receiveBuffer.copy(bufferRecv, 0, nOffset, nOffset + nDataLen);
					osutil.ServerLog("received data, msgID = " + nMsgID + ", length =" + nMsgSize);
					if (nMsgID == 1111)
						myself.Login(client, bufferRecv);
				}
				nOffset += nMsgSize;
				nDataLen -= nMsgSize;
			}
		});
		
		//myself.connCB(netId, session.address);
		//myself.SendHeartbeat(session);
	});
	
	server.listen(myself.port);
};

module.exports = TcpServer;