var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var lua = require('./hello.node');
var redis = require("../util/util_cache");

function DisconnectAccount(account)
{
	if (socketTable[account] != null)
	{
		socketTable[account].disconnect();
		socketTable[account] = null;
	}
}

function RefreshScript()
{
	if (!lua.DoFile('./fight/LuaScripts/Main.lua', function(info){ console.log(info); })) return 0;
	if (!lua.DoFile('./fight/LuaScripts/Scan.lua')) return 0;
	if (!lua.DoFile('./fight/LuaScripts/Test.lua')) return 0;
		
	return 1;
}
	
if (lua.StartLua() != 1)
	console.log('lua init err');
else
{
	lua.SetMsgCallback('SysOutLog', function(info){ console.log(info); });
	var ret = RefreshScript()
	if (ret == 1)
		console.log('lua init ok');
	else
		console.log('lua init failure');
}
			
app.use('/', express.static(__dirname + '/client'));
app.get('/', function(req, res){
	var val = fs.readFileSync("./fight/client/index.html","utf-8");  
	res.end(val);
});

var socketTable = {};

io.on('connection', function(socket)
{
	console.log("aaaaaaaaaaaaaaaaa");
	socket.isFight = false;
	socket.msgList = new Array();
	socket.msgIndex = 1;
	socket.n = 1;
	
	socket.RunLua = function (luafun)
	{
		if (socket.roleObj == null)
		{
			console.log('this is big big bug');
			return;
		}
		
		if (socket.isFight == true)
		{
			console.log('this is bug');
			throw "chuizi";
		}

		socket.isFight = true;
		socket.emit('ScanBegin');

		lua.SetMsgCallback( 'OutLog', function(msg, info){
			if (info == "404")
			{
				console.log(msg);
			}
			else if (info == "0")
			{
				socket.msgList[socket.msgIndex] = new Object();
				socket.msgList[socket.msgIndex].msg = msg;
				socket.msgList[socket.msgIndex].info = info;
				socket.msgIndex++;
			}
			else if (info == "1")
			{
				socket.emit('Count_Info', {jsonInfo:msg});
			}
		});
			
		lua.DoFun(luafun, socket.roleObj.Account);
		socket.MyInterval = setInterval(socket.SendMsgList, 1000);
	}
	
	socket.SendMsgList = function ()
	{
		do
		{
			socket.emit('Scan_Info', {info:socket.msgList[socket.n].info, content:socket.msgList[socket.n].msg});
			socket.n++;
		}
		while (socket.n < socket.msgList.length && socket.msgList[socket.n].info != 0)

		if (socket.n >= socket.msgList.length)
		{
			socket.msgIndex = 1;
			socket.n = 1;
			socket.msgList = [];
			clearInterval(socket.MyInterval);
			
			socket.isFight = false;
			socket.emit('ScanEnd');
		}
	}
	
	socket.on('test', function(obj)
	{	
		console.log("test");
		socket.emit('test_Ret');
	});
	
	socket.on('login', function(obj)
	{
		console.log("bbbbbbbbbbbbb");
		if (obj.Account == null || obj.LoginKey == null)
		{
			console.log("obj.Account == null || obj.LoginKey == null");
			socket.emit('Err', {info:"Account == null || LoginKey == null"});
			socket.disconnect();
			return;
		}
		
		console.log("aaaaaaaaaaaaaaaaa");
		redis.GetCache().hget('account', 'acc_' + obj.Account, function (error, responseObj) 
		{
			if (error)
			{
				console.log(error);
				socket.disconnect();
				return;
			}
			
			if (redis.IsNullOrEmpty(responseObj))
			{
				console.log('this is big bug');
				socket.disconnect();
				return;
			}
			
			var roleObj = JSON.parse(responseObj);
			
			console.log("C:account:" + obj.Account     + "|LoginKey:" + obj.LoginKey);
			console.log("S:account:" + roleObj.Account + "|LoginKey:" + roleObj.LoginKey);
			
			// 判断登录标记
			if (roleObj.Account != obj.Account || roleObj.LoginKey != obj.LoginKey)
			{
				console.log("Account: " + obj.Account + "  LoginKey err");
				socket.disconnect();
				return;
			}
			
			DisconnectAccount(roleObj.Account);
			
			socketTable[roleObj.Account] = socket;
			
			socket.roleObj = roleObj;
		
			socket.broadcast.emit('broadcast message', {content:'Account:' + roleObj.Account + '进入游戏'});
			console.log('login Account:' + roleObj.Account + '       LoginKey:' + roleObj.LoginKey);
			socket.emit('loginRet', {content:"Y"});
		});
	});
	
	socket.on('Scan', function()
	{
		socket.RunLua('Scan');
	});
	
	socket.on('Test', function(){
		socket.RunLua('Test');
		socket.emit('Err', {info:"体力恢复"});
	});
	
	socket.on('RefreshScript', function()
	{
		RefreshScript();
		
		console.log(socket.roleObj.Account + 'RefreshScript');
		socket.emit('Err', {info:"RefreshScript"});
		socket.emit('ScanEnd');
	});
	
	socket.on('disconnect', function(){
		if (socket.roleObj != null)
			DisconnectAccount(socket.roleObj.Account);
		console.log('disconnect1');
	});
	
	socket.on('message', function(obj){
		console.log('message');
	});
});

io.on('disconnect', function(){
	console.log('disconnect2');
});

http.listen(8088, function(){
    console.log('FightServer listening on *:8088');
});

exports.DisconnectAccount = DisconnectAccount;