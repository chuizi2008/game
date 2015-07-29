var fs = require('fs');
var formidable = require('formidable');
var redis = require("../util/util_cache");
var pageHtml = fs.readFileSync("./data/CreateRole.html","utf-8");  
var OtherManager = require("../Manager/OtherManager");

function Send(res) 
{
    try 
	{
		res.writeHead(200, {'content-type': 'text/html'});
		res.write('<head><meta charset="utf-8"/></head>');  
		res.end(pageHtml);
    }
    catch (err) 
	{
        console.log("Exception:  " + err + "]");
    }
}

function Recv(req, res)
{
    try 
	{
        var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) 
		{
			if (fields.Account == null || fields.Password == null ||
				fields.Occupation == null  )
			{
				Send(res);
				return;
			}
			
			redis.GetCache().hget('account', 'acc_' + fields.Account, function (error, responseObj) 
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
					console.log("Account: " + fields.Account + "  load err");
					return;
				}
				
				roleObj = JSON.parse(responseObj);
				
				// 设置登录标记
				if (roleObj.LoginKey != fields.Password)
				{
					console.log("Account: " + fields.Account + "  LoginKey err");
					return;
				}
				
				var dataObj = new Object();
				dataObj.Account		 = roleObj.Account;
				dataObj.Occupation   = fields.Occupation;		// 职业
				dataObj.Level		 = 1;						// 等级
				dataObj.MovePoint    = 10;						// 行动力
				dataObj.AttackLevel  = 1;						// 攻击等级
				dataObj.DeffineLevel = 1;						// 防御等级
				dataObj.Gold = 0;								// 金币
				redis.GetCache().hmset('roledbi', 'acc_' + fields.Account, JSON.stringify(dataObj), function(error1)
				{
					if (err)
					{
						OtherManager.Out404(res, err.stack);
						return;
					}
					
					OtherManager.GoFight(res);
				});
			});
		});
		return;
    }
    catch (err) 
	{
        res.writeHead(200, {'content-type': 'text/plain'});
		res.end(err.stack);
    }
}

exports.Send = Send;
exports.Recv = Recv;