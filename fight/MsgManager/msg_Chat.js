var msgID = require('./NetMessageIds');
var NetConfiguration = require("./NetConfiguration");
var SendBuffer = require("../../lib/SendBuffer");
var OtherManager = require("../../lib/other");
var colors = require('colors');

exports.MsgID  = msgID.MSG_CHAT;

function Send_Broadcast(typeVal, accVal, infoVal)
{
	process.send({cmd : "Broadcast", type : typeVal, account : accVal, info : infoVal});
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

	// 广播
	if (type == 1)
		Send_Broadcast(1, client.roleObj.Account + ":  " + text);
};

// 聊天消息广播版
exports.Send_Broadcast = Send_Broadcast;