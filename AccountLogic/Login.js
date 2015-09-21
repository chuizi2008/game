var formidable = require('formidable');
// var md5 = require("../lib/md5");
var OtherManager = require("../Manager/OtherManager");
var MySQLManager = require("../Manager/MySQLManager");
var regServer = require("./RegServer");

function Redis_Create( serverInfo, account, res )
{
	var roleObj = new Object;
	roleObj.Account = account;
	roleObj.LoginKey = OtherManager.GetLoginKey();
	
	serverInfo.redis.hmset('account', 'acc_' + account, JSON.stringify(roleObj), function(error1)
	{
		try 
		{
			if (error1) 
			{
				console.log(error);
				OtherManager.OutRet(res, 0, "");
				return;
			}
			
			OtherManager.OutRet(res, 200, roleObj.LoginKey);
		}
		catch (error2) 
		{
			console.log(error2.stack);
			OtherManager.OutRet(res, 0, "");
		}
	});
}

function Redis_Login( serverInfo, account, res )
{
	// 连接到对应的REDIS数据库，重新设置新的LoginKey
	serverInfo.redis.hget('account', 'acc_' + account, function (error, responseObj)
	{
		var roleObj;
			
		// 获取缓存失败
		if (error)
		{
			console.log(error);
			OtherManager.OutRet(res, 0, "");
			return;
		}
			
		Redis_Create(serverInfo, account, res);
	});
}


function Recv(req, res, params, serverList) 
{
	var account = params.query.acc;
	// var password = faultylabs.MD5(params.query.pass)
	var password = params.query.pass;
	var serverID = params.query.serverID;

	if (OtherManager.IsNullOrEmpty(account) || OtherManager.IsNullOrEmpty(password))
	{
		OtherManager.OutRet(res, 0, "");
		return;
	}
	
	var strQuery = "select * from account where account = '" + account + "' and password = '" + password + "'";
	MySQLManager.Query(strQuery, function(ret)
	{
		if (ret == null)
		{
			OtherManager.OutRet(res, 0, "");
			return;
		}
		else if (ret.length != 1)
		{
			OtherManager.OutRet(res, 1, "");
			return;
		}
		
		// 检测对应的服务器开么开
		var info = regServer.GetServerInfo(serverID);
		if (info == null)
		{
			OtherManager.ServerLog(3, serverID + "服务器无效或者不存在");
			OtherManager.OutRet(res, 4, "");
			return;
		}
	
		Redis_Login(info, account, res);
	});
}

exports.Recv = Recv;