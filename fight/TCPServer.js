var uuid = require('node-uuid');
var net = require('net');
var redis = require("../lib/cache");
var OtherManager = require("../Manager/OtherManager");
var LuaManager = require("../Manager/LuaManager");
var NetConfiguration = require("./MsgManager/NetConfiguration");
var SendBuffer = require("../lib/SendBuffer");
var msgID = require('./MsgManager/NetMessageIds');
var msg_Chat = require('./MsgManager/msg_Chat');

function TcpServer(nPort, name)
{
	this.port = nPort;
	this.serverName = name;
	this.ClientTable = new Object();
	this.MsgManager = OtherManager.FindMsgInDirectory('./fight/MsgManager');
}

TcpServer.prototype.Broadcast = function (type, account, info)
{
	var myself = this;
	
	try
	{
		var utf8Len = Buffer.byteLength(info, 'utf8');
		if (utf8Len == 0)
			return;
		
		// type 2 消息类型(1:系统 2:密聊)
		var msgLen = 2 + 2 + utf8Len;
		var msgBuff = new SendBuffer(msgLen, msgID.MSG_CHAT);
		msgBuff.WriteUInt16LE(type);
		msgBuff.WriteString(info);
		
		for (var client in myself.ClientTable)
			msgBuff.SendMsg(myself.ClientTable[client]);
		
		// msg_Chat.Send_Test_OK(myself.ClientTable[account]);
		// 广播完毕，如果自己在里面就
		// myself.DisconnectAccount(account)
	}
	catch (err)
	{
		OtherManager.ServerLog(2, err.stack);
	}
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
		delete myself.ClientTable[account];
		myself.ClientNum--;
	}
}

TcpServer.prototype.ShowOnlineNum = function ()
{
	var myself = this;
	OtherManager.ServerLog(2, "当前在线:" + myself.ClientNum);
}

TcpServer.prototype.CheckLogin = function (msg)
{
	var myself = this;
	
	if (msg.WorkerID == myself.WorkerID)
		return;

	myself.DisconnectAccount(msg.Account);
}

// 开启服务
TcpServer.prototype.Start = function () {
    LuaManager.CreateLua();
    var server = net.createServer();
    var myself = this;
    myself.ClientTable = [];
    myself.ClientNum = 0;

    server.ServerLog = function (errLevel, str, stack) {
        OtherManager.ServerLog(errLevel, "[" + myself.serverName + "]   " + str, stack);
    }
    myself.ServerLog = server.ServerLog;

    server.on('error', function (e) {
        server.ServerLog(2, "TcpServer error, error code: " + e.code);
    });

    server.on('close', function () {
        server.ServerLog(1, "TcpServer close");
    });

    server.on('listening', function () {
        server.ServerLog(1, "TcpServer listening: " + myself.port);
    })

    server.on('connection', function (client) {
        // server.ServerLog(1, "client connected, ip:" + client.remoteAddress);

        client.on('close', function () {
            myself.DisconnectAccount(client.roleObj.Account);
            server.ServerLog("client closed, ip:" + client.remoteAddress);
            // 内部打印当前人数
            server.ServerLog(1, "当前在线人数:" + myself.ClientNum);
        });

		client.on('end', function (error) {
            server.ServerLog(1, "client closed, ip:" + client.remoteAddress);
            // 内部打印当前人数
            server.ServerLog(1, "当前在线人数:" + myself.ClientNum);
        });
		
        client.on('error', function (error) {
            server.ServerLog(3, myself.serverName + ": client error: " + error + ", ip:" + client.remoteAddress);
        });

        client.on('drain', function () {
            server.ServerLog(3, myself.serverName + ": send data end, ip:" + client.remoteAddress);
        });

        //存储数据
        var bufferTemp = new Buffer(0);
        var index = 0;

        // 接收数据
        client.on('data', function (data) {
            // 这个TCP并不像以往C++那种SOCKET，是不分包的，对的就是不分包，需要自己组装，拆分
            // 应该说是流方式
            var receiveBuffer = new Buffer(bufferTemp.length + data.length);
            if (bufferTemp.length > 0) {
                bufferTemp.copy(receiveBuffer, 0, 0, bufferTemp.length);
                data.copy(receiveBuffer, bufferTemp.length, 0, data.length);
            }
            else {
                data.copy(receiveBuffer, 0, 0, data.length);
            }

            var nOffset = 0;
            var nDataLen = receiveBuffer.length;
            while (true) {
                // 异常
                if (nDataLen <= 0) {
                    bufferTemp = new Buffer(0);
                    break;
                }

                // 小于最小包标准，就是只有包头
                if (nDataLen < NetConfiguration.MsgHeadSize) {
                    bufferTemp = new Buffer(nDataLen);
                    receiveBuffer.copy(bufferTemp, 0, nOffset, nOffset + nDataLen);
                    break;
                }

                // 包内容超过标准
                var nMsgSize = receiveBuffer.readUInt16LE(nOffset);
                if (nMsgSize > NetConfiguration.MsgBodySize) {
                    bufferTemp = new Buffer(0);
                    break;
                }

                // 包大小不完全，等待下一个内容
                if (nMsgSize > nDataLen) {
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

                // 心跳包
                if (nMsgID == NetConfiguration.heartBeatMsgID) {
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
                else {
                    var bufferRecv = new Buffer(nMsgSize);
                    receiveBuffer.copy(bufferRecv, 0, nOffset, nOffset + nDataLen);
                    server.ServerLog(1, "received data, msgID = " + nMsgID + ", length =" + nMsgSize);
                    try 
					{
                        myself.MsgManager[nMsgID](myself, client, bufferRecv);
                    }
                    catch (error) 
					{
						server.ServerLog(2, error);
                    }
                }
                nOffset += nMsgSize;
                nDataLen -= nMsgSize;
            }
        });
    });

    server.listen(myself.port);
};

module.exports = TcpServer;