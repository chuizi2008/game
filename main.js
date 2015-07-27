var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
	fs = require('fs');

var redis = require("./util/util_cache");
var hashTable = [];   // 声明对象
hashTable["/CreateAccount"] = require("./js/CreateAccount");
hashTable["/CreateFight"] = require("./js/CreateFight");
hashTable["/Main"] = require("./js/Main");

// 初始化战斗模块
var fight = require("./fight/index");

redis.ConnectRedis("192.168.0.35", 6379, function (){
});

//用http模块创建一个http服务端 
http.createServer(function(req, res) 
{
	try
	{
		if (req.url == "/")
		{
			hashTable["/CreateAccount"].Send(res);
			return;
		}
		
		var fun = hashTable[req.url];
		if(fun && req.method.toLowerCase() === 'post')
		{
			var ret = fun.Recv(req, res, function (req, res, roleObj)
			{
				if (req.url == '/CreateAccount')
					hashTable["/Main"].Send(req, res, roleObj);
				else if (req.url == '/CreateFight')
				{
					res.writeHead(302, {'Location': 'http://192.168.1.191:8088'});
					res.end();
				}
			});
		}
	}
	catch(e)
	{
		console.log(e);
	}
}).listen(8080, "0.0.0.0");


