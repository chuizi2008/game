//-----------------------------------------------------------------------------
// 常量定义
//-----------------------------------------------------------------------------

var RESPONSE_STATE = {
    OK: 0,
    InvalidRequest_AccountLocked: 3001, // 账号被锁定
	InvalidRequest_AccountNotFound: 3004, // 帐号不存在
	ServerException: 6000, // 服务器执行出现了异常
	ServerException_GetAccountDataFailed_Cache: 6001,
	ServerException_UnknownError                                : 6999            // 未知错误
};
exports.RESPONSE_STATE = RESPONSE_STATE;

