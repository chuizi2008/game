var fs = require('fs');
var formidable = require('formidable');
var redis = require("../lib/cache");
var OtherManager = require("../Manager/OtherManager");

function Send_Jump(res, account, loginkey)
{
	/*
	这里这么做主要是要应付浏览器端和手游端的
	手游端通过直接获取第一行 帐号:KEY来进行后续操作
	而浏览器需要执行后面JS脚本，来设置Cookies
	*/
	var chuizi = "<script language=\"JavaScript\" type=\"text/javascript\">" + 
					"document.cookie= \"Account = " + account + "\";" +
					"document.cookie= \"LoginKey  = " + loginkey + "\";" +
					"window.location.href=\"http://192.168.1.191:8088\";" +
					"</script>";
					
	res.writeHead(200, {'content-type': 'text/html'});
	res.write(account + ':' + loginkey);
	res.end(chuizi);
}

function Send(res) 
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
					console.log('account ' + roleObj.Account + 'LoginKey ' + roleObj.LoginKey);
					redis.GetCache().hmset('account', 'acc_' + fields.Account, JSON.stringify(roleObj), function(error1)
					{
						try 
						{
							if (error1) 
							{
								OtherManager.Out404(res, fields.Account + ' 保存失败 info:' + error1);
								return;
							}
							
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
									Send_Jump(res, roleObj.Account, roleObj.LoginKey);
							});
						}
						catch (error2) 
						{
							OtherManager.Out404(res, error2.stack);
						}
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