var msgID = require('./NetMessageIds');
var sendBroadcast = require('./msg_Chat');
var redis = require("../../lib/cache");
var NetConfiguration = require("./NetConfiguration");
var SendBuffer = require("../../lib/SendBuffer");

function Send(client, ret)
{
	var msgBuff = new SendBuffer(2, msgID.MSG_LOGIN);
	msgBuff.WriteUInt16LE(ret);
	
	if (ret != 1)
	{
		msgBuff.SendMsg(client, function()
		{
			console.log('close');
			client.end();
		});
	}
	else
	{
		msgBuff.SendMsg(client);
	}
}

exports.MsgID  = msgID.MSG_LOGIN;
exports.Recv = function(tcpServer, client, obj) 
{
	var myself = this;
	var nOffset = 0;
	
	var len = obj.readUInt16LE(nOffset); 
	nOffset += 2;
	if (len <= 0)
	{
		client.destroy();
		return;
	}
	
	var Account = obj.toString('utf8', nOffset, nOffset + len);	
	nOffset += len;

	len = obj.readUInt16LE(nOffset); 
	nOffset += 2;
	if (len <= 0)
	{
		console.log(len);
		client.destroy();
		return;
	}

	var LoginKey = obj.toString('utf8', nOffset, nOffset + len);
	nOffset += len;
		
	redis.GetCache().hget('account', 'acc_' + Account, function (error, responseObj) 
	{
		if (error)
		{
			console.log(error);
			client.destroy();
			return;
		}
		
		if (redis.IsNullOrEmpty(responseObj))
		{
			console.log('this is big bug');
			client.destroy();
			return;
		}
		
		var roleObj = JSON.parse(responseObj);
		
		// console.log("C:account:" + Account     + "|LoginKey:" + LoginKey);
		// console.log("S:account:" + roleObj.Account + "|LoginKey:" + roleObj.LoginKey);
		
		// 判断登录标记
		if (roleObj.Account != Account || roleObj.LoginKey != LoginKey)
		{
			console.log("Account: " + Account + "  LoginKey err");
			Send(client, 0);
			return;
		}

		tcpServer.DisconnectAccount(roleObj.Account);

		tcpServer.ClientTable[roleObj.Account] = client;
		
		client.roleObj = roleObj;
		
		Send(client, 1);
		
		console.log('login ok');
		
		// 广播
		sendBroadcast.Send_Broadcast(tcpServer, 1, "欢迎新的锤子[" + Account + "]加入游戏")
	});
};