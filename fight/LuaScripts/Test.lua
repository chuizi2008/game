local json = require "json";

function Test(account)
	local jsonData = Redis_Get(account);
		if (jsonData == 0) then
			OutLog('Account:'..account..' Get Redis error', '404');
		end
		
	local roleObj = json.decode(jsonData);
	roleObj.MovePoint = 10;
	jsonData = json.encode(roleObj);
	Redis_Set(account, jsonData);
	OutLog_CountInfo(jsonData);
end