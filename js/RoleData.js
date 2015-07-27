var redis = require('../util/redis');

function TheBegin(host, port, callback) 
	redis.ConnectRedis(host, port, callback)
end

exports.TheBegin = TheBegin;