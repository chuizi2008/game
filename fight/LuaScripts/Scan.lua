local json = require "json";

-- 探险
function Scan(account)
	math.randomseed(os.time() );
	
	OutLog_FightInfo("探险开始"..account);
	
	local jsonData = Redis_Get(account);
	if (jsonData == 0) then
		OutLog('Account:'..account..' Get Redis error', '404');
	end
	
	local roleObj = json.decode(jsonData);

	if (roleObj.MovePoint <= 0) then
		OutLog_FightInfo("行动点数不足");
		return;
	end

	-- 100%触发战斗
	local randVal = math.random(1, 100);
	if (randVal > 0 and randVal <= 100) then
		Fight1(roleObj);
	end
	
	roleObj.MovePoint = roleObj.MovePoint - 1;
	OutLog_FightInfo("移动点数扣1点");
	OutLog_FightInfo("探险结束");
	
	jsonData = json.encode(roleObj);
	Redis_Set(account, jsonData);
	OutLog_CountInfo(jsonData);
	return true;
end

function Fight1(roleObj)
	local randVal = math.random(1, 100);
	OutLog_FightInfo("Fight..Rand"..randVal);
	if (randVal > 0 and randVal <= 60) then
		-- 胜利，根据（攻击和防御等级之后/2）获得对应奖励
		local val = math.floor((roleObj.AttackLevel + roleObj.DeffineLevel) / 2);
		OutLog_FightInfo("获得金币:"..val);
		roleObj.Gold = roleObj.Gold + val;
	elseif (randVal > 60 and randVal <= 90) then
		OutLog_FightInfo("逃跑");
		-- 逃跑。强制等待10秒，才能后续操作
		--[[
		for n=0,9 do  
			OutLog_FightInfo("正在慌乱的逃跑中..."..10 - n);
		end
		--]]
		OutLog_FightInfo("逃跑成功");
	else
		-- 失败，金币会有一定几率折损
		randVal = math.random(1, 10);
		local val = math.floor(roleObj.Gold / randVal);
		OutLog_FightInfo("折损金币:"..val);
		roleObj.Gold = roleObj.Gold - val;
	end
end
-- End of Script
