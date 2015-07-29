var fs = require('fs');
var path = require('path');
var uuid = require("node-uuid");

var errPage = fs.readFileSync("./data/404.html","utf-8");

// 加载所有页面模块
var hashTable = FindJSInDirectory('./js');

function FindJSInDirectory(currentDir) 
{
	console.log('module load begin');
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
				console.log("pid: " + process.pid + " Add request handler [" + filepath + "] to path [" + httpPath + "]");
				actions[httpPath] = require('../' + filepath);
			}
		}
	}
	
	console.log('module load end');
	return actions;
};

function Out404(res, info)
{
	res.writeHead(200, {'content-type': 'text/html;charset:utf-8 '});
	res.write('<head><meta charset="utf-8"/></head>');  
	res.write("<span style=\"font-size:48px;color:red;\">" + info + "</span>");
	res.end(errPage);
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

exports.FindJSInDirectory = FindJSInDirectory;
exports.Out404      	  = Out404;
exports.JumpPage    	  = JumpPage;
exports.GetLoginKey 	  = GetLoginKey;
exports.GoFight			  = GoFight;

