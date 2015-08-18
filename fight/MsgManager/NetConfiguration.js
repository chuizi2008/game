// 包大小[2] + 包消息标识[2] + 包实际内容[0x0FFF]
exports.MsgHeadSize = 4;
exports.MsgBodySize = 0x0FFF;
exports.MsgMaxSize = 4 + 0x0FFF;

// 心跳包相关
exports.heartBeatCheckTime = 7000;
exports.heartBeatIndexMax = 0x7FFF;
exports.heartBeatMsgID = 0xFFFF;