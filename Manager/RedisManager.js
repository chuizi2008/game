//-----------------------------------------------------------------------------
// 缓存服务器相关的逻辑
//-----------------------------------------------------------------------------
var redis = require('redis');
var OtherManager = require("./OtherManager");

// 连接Redis，连接成功后调用回调函数
function ConnectRedis(host, port, callback) 
{
    // 连接断开
    function ReConnect() 
    {
        cache.cacheConnectOK = false;

        // 断线重连
        OtherManager.ServerLog("Redis (" + host + ":" + port + ") connection closed, restart...");
        cache = redis.createClient(port, host, { parser: "javascript", return_buffers: false });

        cache.on("ready", function () 
        {
            cache.cacheConnectOK = true;
            OtherManager.ServerLog("Redis (" + host + ":" + port + ") connect OK");
        });

        cache.on("error", function (err) {
            OtherManager.ServerLog("Error: Redis connect (" + host + ":" + port + ")", err);
            RedisEnd();
        });

        cache.on("end", ReConnect);
    }

	cache = redis.createClient(port, host, {parser:"javascript", return_buffers:false});
	cache.cacheConnectOK = false;
	
	cache.on("ready", function () {
	    cache.cacheConnectOK = true;
	    if (!OtherManager.IsNullOrEmpty(callback))
	        callback();
	});

	cache.on("error", function (err) {
        OtherManager.ServerLog("Error: Redis connect (" + host + ":" + port + ")", err);
        RedisEnd();
	});

    cache.on("end", ReConnect);
	
	return cache;
}

exports.ConnectRedis = ConnectRedis;
