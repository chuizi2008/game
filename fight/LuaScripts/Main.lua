package.path = package.path .. ";./fight/LuaScripts/?.lua" .. ";./fight/LuaScripts/DataManager/?.lua" .. ";./fight/LuaScripts/Lib/?.lua" .. ";./fight/LuaScripts/Fight/?.lua";

local max              = _G.math.max;
local min              = _G.math.min;

-- 显示上面的东西
function OutLog_FightInfo(msg)
	OutLog(msg, '0');
end

-- 显示下面的东西
function OutLog_CountInfo(msg)
	OutLog(msg, '1');
end

-- 连接到Redis
Redis_Open("192.168.0.35", 6379);
local str = Redis_Get("test");
if (str == 0) then
	SysOutLog('get error');
else
	SysOutLog(str);
end

SysOutLog('main load ok');