var formidable = require('formidable');
var OtherManager = require("../Manager/OtherManager");
var md5 = require("../lib/md5");
var MySQLManager = require("../Manager/MySQLManager");

function Recv(req, res, params) 
{
	var account = params.query.acc;
	var password = faultylabs.MD5(params.query.pass)

	if (OtherManager.IsNullOrEmpty(account) || OtherManager.IsNullOrEmpty(password))
	{
		OtherManager.OutRet(res, 0, "");
		return;
	}
	
	console.log(account);
	console.log(password);
	
	var strQuery = "insert into account (account, password) VALUES ('" + account + "', '" + password + "')";
	MySQLManager.Query(strQuery, function(ret)
	{
		if (ret != null)
			OtherManager.OutRet(res, 0, "");
		else
			OtherManager.OutRet(res, 200, "");
	});
}

exports.Recv = Recv;