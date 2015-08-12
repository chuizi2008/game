var fs = require('fs');
var formidable = require('formidable');
var redis = require("../lib/cache");
var OtherManager = require("../Manager/OtherManager");
var pageHtml = fs.readFileSync("./data/CreateAccount.html","utf-8");

function Send_Jump(res, account, loginkey)
{
	/*
	这里这么做主要是要应付浏览器端和手游端的
	手游端通过直接获取第一行 帐号:KEY来进行后续操作
	而浏览器需要执行后面JS脚本，来设置Cookies
	*/
	var chuizi = "<script language=\"JavaScript\" type=\"text/javascript\">" + 
					"document.cookie= \"AccountID = " + account + "\";" +
					"document.cookie= \"LoginKey  = " + loginkey + "\";" +
					"window.location.href=\"http://192.168.1.191:8080/CreateRole\";" +
					"</script>";
					
	res.writeHead(200, {'content-type': 'text/html'});
	res.write(account + ':' + loginkey);
	res.end(chuizi);
}

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
        var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields) 
		{
			redis.GetCache().hget('account', 'acc_' + fields.Account, function (error, responseObj) 
			{
				try 
				{
					var roleObj;
					
					// 获取缓存失败
					if (error)
					{
						OtherManager.Out404(res, fields.Account + ' 创建失败');
						return;
					}
					
					if (redis.IsNullOrEmpty(responseObj))
					{
						console.log(':::' + fields.Password);
						
						roleObj = new Object;
						roleObj.Account = fields.Account;
						roleObj.Password = fields.Password;
						roleObj.Name = fields.Account;
						roleObj.LoginKey = OtherManager.GetLoginKey();
						redis.GetCache().hmset('account', 'acc_' + fields.Account, JSON.stringify(roleObj), function(error1)
						{
							try 
							{
								if (error1) 
								{
									OtherManager.Out404(res, fields.Account + ' 创建失败 info:' + error1);
									return;
								}
								
								console.log("Account: " + roleObj.Account + "  Create OK");
								
								// 创建成功后，跳转到创建角色页面
								Send_Jump(res, roleObj.Account, roleObj.LoginKey);
							}
							catch (err) 
							{
								OtherManager.Out404(res, err.stack);
							}
						});
					}
					else
					{
						OtherManager.Out404(res, fields.Account + ' 帐号已经存在,创建失败');
						return;
					}
				}
				catch (err) 
				{
					OtherManager.Out404(res, err.stack);
				}
			});
		});
		return;
}

exports.Send = Send;
exports.Recv = Recv;