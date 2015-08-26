var lua = require('./hello.node');
var OtherManager = require("../Manager/OtherManager");

function CreateLua()
{
	if (lua.StartLua() != 1)
		OtherManager.ServerLog('lua init err');
	else
	{
		lua.SetMsgCallback('SysOutLog', function(info){ console.log(info); });
		var ret = this.RefreshScript()
		if (ret != 1)
			OtherManager.ServerLog('lua init failure');
	}
}

function RefreshScript()
{
	if (!lua.DoFile('./fight/LuaScripts/Main.lua', function(info){ console.log(info); })) return 0;
	if (!lua.DoFile('./fight/LuaScripts/Scan.lua')) return 0;
	if (!lua.DoFile('./fight/LuaScripts/Test.lua')) return 0;
		
	return 1;
}

exports.CreateLua = CreateLua;
exports.RefreshScript = RefreshScript;


