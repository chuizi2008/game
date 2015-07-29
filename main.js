var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
	fs = require('fs');

var OtherManager = require("./Manager/OtherManager");
var FileManager = require("./Manager/FileManager");

var redis = require("./util/util_cache");

// 初始化战斗模块
var fight = require("./fight/index");

// 初始化数据库连接部分
redis.ConnectRedis("192.168.0.35", 6379, function (){
});

//用http模块创建一个http服务端 
http.createServer(function(req, res) 
{
	try
	{
		if (req.url == "/favicon.ico")
			return;

		// 最开始是管理器部分
		if (req.url == "/UpFile")
		{
			FileManager.UpFile(req, res);
			return;
		}
		else if (req.url.indexOf("/GetFile=") >= 0 )
		{
			FileManager.GetFile(req, res);
			return;
		}
		else if (req.url.indexOf("/GetFileEX=") >= 0 )
		{
			FileManager.GetFileEX(req, res);
			return;
		}
		
		OtherManager.JumpPage(req.method.toLowerCase() == 'post', req, res, req.url);
	}
	catch(e)
	{
		console.log(e);
	}
}).listen(8080, "0.0.0.0");


