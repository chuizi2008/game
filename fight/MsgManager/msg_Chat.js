var msgID = require('./NetMessageIds');
var NetConfiguration = require("./NetConfiguration");
var SendBuffer = require("../../lib/SendBuffer");
var OtherManager = require("../../lib/other");
var colors = require('colors');

exports.MsgID  = msgID.MSG_CHAT;

function Send_Broadcast(tcpServer, type, info)
{
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
		
		 for (var client in tcpServer.ClientTable)
			 msgBuff.SendMsg(tcpServer.ClientTable[client]);
	}
	catch (err)
	{
		console.log(colors.yellow(err.stack));
	}
}

exports.Recv = function(tcpServer, client, obj) 
{
	var myself = this;
	var nOffset = 0;
	
	var type = obj.readUInt16LE(nOffset); 
	nOffset += 2;

	var len = obj.readUInt16LE(nOffset); 
	nOffset += 2;
	
	var text = obj.toString('utf8', nOffset, nOffset + len);
	nOffset += len;
		
	console.log(text);
		
	// 广播
	if (type == 1)
		Send_Broadcast(tcpServer, 1, client.roleObj.Account + ":  " + text)
};

// 聊天消息广播版
exports.Send_Broadcast = Send_Broadcast;