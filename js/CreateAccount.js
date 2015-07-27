var fs = require('fs');
var formidable = require('formidable');
var redis = require("../util/util_cache");
var uuid = require("node-uuid");

function Send(res) 
{
    try 
	{
        var val = fs.readFileSync("./data/CreateAccount.txt","utf-8");  
		res.writeHead(200, {'content-type': 'text/html'});
		res.end(val);
    }
    catch (err) 
	{
        console.log("Exception:  " + err + "]");
    }
}

function Recv(req, res, callback)
{
        var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields) 
		{
			redis.GetCache().hget('account', 'acc_' + fields.account, function (error, responseObj) 
			{
				try 
				{
					var roleObj;
					
					// 获取缓存失败
					if (error)
					{
						res.writeHead(200, {'content-type': 'text/plain'});
						res.end("account:" + fields.account + "       hmset err   error info:" + error);
						return;
					}
					
					if (redis.IsNullOrEmpty(responseObj))
					{
						roleObj = new Object;
						roleObj.account = fields.account;
						roleObj.name = fields.account;
						roleObj.LoginKey = uuid.v1();	// 设置登录标记
						redis.GetCache().hmset('account', 'acc_' + fields.account, JSON.stringify(roleObj), function(error1)
						{
							if (error1) 
							{
								res.writeHead(200, {'content-type': 'text/plain'});
								res.end("account:" + fields.account + "       hmset err  info:" + error1);
								return;
							}
							
							console.log("Account: " + roleObj.account + "  Create OK");
						});
					}
					else
					{
						console.log("Account: " + fields.account + "  Login OK");
						roleObj = JSON.parse(responseObj);
					}

					roleObj.LoginKey = uuid.v1();	// 设置登录标记
					redis.GetCache().hmset('account', 'acc_' + fields.account, JSON.stringify(roleObj), function(error1){});

					// 继续发后面的
					callback(req, res, roleObj);
				}
				catch (err) 
				{
					res.writeHead(200, {'content-type': 'text/plain'});
					res.end(err.stack);
					console.log(err.stack);
				}
			});
		});
		return;
}

exports.Send = Send;
exports.Recv = Recv;