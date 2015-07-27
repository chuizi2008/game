//-----------------------------------------------------------------------------
// 缓存服务器相关的逻辑
//-----------------------------------------------------------------------------


var redis = require('redis');
var util_other = require('./util_other');

var cache = null;
var cacheConnectOK = false;

// 连接Redis，连接成功后调用回调函数
function ConnectRedis(host, port, callback) 
{
    // 连接断开
    function ReConnect() 
    {
        cacheConnectOK = false;

        // 断线重连
        util_other.ServerLog("Redis (" + host + ":" + port + ") connection closed, restart...");
        cache = redis.createClient(port, host, { parser: "javascript", return_buffers: false });

        cache.on("ready", function () 
        {
            cacheConnectOK = true;
            util_other.ServerLog("Redis (" + host + ":" + port + ") connect OK");
        });

        cache.on("error", function (err) {
            util_other.ServerLog("Error: Redis connect (" + host + ":" + port + ")", err);
            RedisEnd();
        });

        cache.on("end", ReConnect);
    }

    cacheConnectOK = false;
    util_other.ServerLog("connect Redis host:" + host + "  port:" + port);
	cache = redis.createClient(port, host, {parser:"javascript", return_buffers:false});

	cache.on("ready", function () {
	    cacheConnectOK = true;
	    util_other.ServerLog("Redis (" + host + ":" + port + ") connect OK");
	    if (!util_other.IsNullOrEmpty(callback))
	        callback();
	});

	cache.on("error", function (err) {
        util_other.ServerLog("Error: Redis connect (" + host + ":" + port + ")", err);
        RedisEnd();
	});

    cache.on("end", ReConnect);
}

function IsNullOrEmpty(str) {
	return str === undefined || str === null || str == "";
};

exports.IsNullOrEmpty = IsNullOrEmpty;
exports.ConnectRedis = ConnectRedis;
exports.GetCache = function () { return cache; };
