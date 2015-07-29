var fs = require('fs');
var formidable = require('formidable');
var redis = require("../util/util_cache");
var OtherManager = require("../Manager/OtherManager");

function Send(req, res, roleObj) 
{
}

function Recv(req, res) 
{
        var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) 
		{
			try 
			{
				if (fields.Account == "" || fields.Password == "")
				{
					OtherManager.Out404(res, "fields.Account is null || fields.Password is null");
					return;
				}
				
				redis.GetCache().hget('account', 'acc_' + fields.Account, function (error, responseObj) 
				{
					var roleObj;
					
					// 获取缓存失败
					if (error)
					{
						OtherManager.Out404(res, error);
						return;
					}
					
					if (redis.IsNullOrEmpty(responseObj))
					{
						OtherManager.Out404(res, '帐号并不存在');
						return;
					}
					
					roleObj = JSON.parse(responseObj);
					
					// 设置登录标记
					if (roleObj.Password != fields.Password)
					{
						OtherManager.Out404(res, '密码不对');
						return;
					}
		
					// 登录成功后，设置LoginKey
					roleObj.LoginKey = OtherManager.GetLoginKey();
					
					// 检测角色数据是否存在，如果不存在，转到角色创建页面，不然跳到战斗
					redis.GetCache().hget('roledbi', 'acc_' + fields.Account, function (error, responseObj) 
					{
						// 获取缓存失败
						if (error)
						{
							OtherManager.Out404(res, error);
							return;
						}
						
						if (redis.IsNullOrEmpty(responseObj))
							OtherManager.JumpPage(false, req, res, '/CreateRole');
						else
							OtherManager.GoFight(res);
					});
				});
			}
			catch (err) 
			{
				res.writeHead(200, {'content-type': 'text/plain'});
				res.end(err.stack);
			}
		});
		return;
}

exports.Send = Send;
exports.Recv = Recv;