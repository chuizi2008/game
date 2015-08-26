var fs = require('fs');
var path = require('path');
var uuid = require("node-uuid");
var colors = require('colors');

var errPage = fs.readFileSync("./data/404.html","utf-8");

// 加载所有页面模块
var hashTable = FindJSInDirectory('./js');

function IsNullOrEmpty(str) 
{
	return str === undefined || str === null || str === '';
}

function FindJSInDirectory(currentDir) 
{
	var actions = [];
	var files = fs.readdirSync(currentDir);

	for(var i in files) 
	{
		var filepath = path.normalize(path.join(currentDir, files[i]));
		var fState = fs.statSync(filepath);

		if(fState.isFile()) 
		{
			var reg = /js(\S+)\.js$/i;
			var captured = reg.exec(filepath);
			if(captured.length > 0) {
				var httpPath = captured[1].replace("\\", "/");
				actions[httpPath] = require('../' + filepath);
			}
		}
	}
	
	return actions;
};

function FindMsgInDirectory(currentDir) 
{
	var actions = [];
	var files = fs.readdirSync(currentDir);

	for(var i in files) 
	{
		var filepath = path.normalize(path.join(currentDir, files[i]));
		var fState = fs.statSync(filepath);

		if(fState.isFile()) 
		{
			var reg = /MsgManager(\S+)\.js$/i;
			var captured = reg.exec(filepath);
			if (captured.length > 0)
			{
				var ret = require('../' + filepath);
				
				if (typeof(ret.MsgID) == "undefined")
					continue;
				
				if (actions[ret.MsgID] != null)
				{
					ServerLog_Err("MsgID:" + ret.MsgID + " not is null");
					return;
				}
				
				actions[ret.MsgID] = ret.Recv;
				var httpPath = captured[1].replace("\\", "/");
			}
		}
	}
	
	return actions;
};

function Out404(res, info)
{
	res.write('<head><meta charset="utf-8"/></head>');  
	res.write("<span style=\"font-size:48px;color:red;\">" + info + "</span>");
	res.end(errPage);
}

function OutRet(res, code, info)
{
	res.writeHead(200, {'content-type': 'text/html;charset:utf-8 '});
	res.write(code + "\r\n");
	res.end(info);
}

function GetLoginKey()
{
	return uuid.v1();	// 设置登录标记
}

function GoFight(res)
{
	res.writeHead(302, {'Location': 'http://192.168.1.191:8088'});
	res.end();
}

function ServerLog(color, msg, stack) 
{
	var curr = new Date();
	if (color == 1)
	{
		console.log("[" + curr.getFullYear() + "/" + (curr.getMonth() + 1) + "/" + curr.getDate() + " " + curr.toLocaleTimeString() + "." + curr.getMilliseconds() + "]" + msg);
		if (stack)
			console.log(stack);
	}
	else if (color == 2)
	{
		console.log(colors.yellow("[" + curr.getFullYear() + "/" + (curr.getMonth() + 1) + "/" + curr.getDate() + " " + curr.toLocaleTimeString() + "." + curr.getMilliseconds() + "]" + msg));
		if (stack)
			console.log(colors.yellow(stack));
	}
	else if (color == 3)
	{
		console.log(colors.red("[" + curr.getFullYear() + "/" + (curr.getMonth() + 1) + "/" + curr.getDate() + " " + curr.toLocaleTimeString() + "." + curr.getMilliseconds() + "]" + msg));
		if (stack)
			console.log(colors.red(stack));
	}
};

// 页面跳转
function JumpPage(isPost, req, res, url)
{
	if (url == "/")
	{
		hashTable["/Main"].Send(res);
		return;
	}
	else
	{
		var fun = hashTable[url];
		if(fun && isPost)
			fun.Recv(req, res);
		else if(fun && !isPost)
			fun.Send(res);
		else
			Out404(res, '你请求的页面并不存在[' + url + ']');
	}
}

function JumpLogic(req, res, params)
{
	var fun = hashTable[params.pathname];
	if (fun)
		fun.Recv_Get(req, res, params);
	else
		Out404(res, '你请求的页面并不存在[' + url + ']');
}

exports.IsNullOrEmpty	   = IsNullOrEmpty;
exports.FindMsgInDirectory = FindMsgInDirectory;
exports.FindJSInDirectory  = FindJSInDirectory;
exports.Out404      	   = Out404;
exports.OutRet      	   = OutRet;
exports.JumpPage    	   = JumpPage;
exports.JumpLogic    	   = JumpLogic;
exports.GetLoginKey 	   = GetLoginKey;
exports.GoFight			   = GoFight;
exports.ServerLog		   = ServerLog
