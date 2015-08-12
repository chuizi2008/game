var util_constent = require('./constent');

// 日志输出
function ServerLog(msg, error) {
    if (IsNullOrEmpty(msg))
        return;
    var curr = new Date();
    console.log("[" + curr.getFullYear() + "/" + (curr.getMonth() + 1) + "/" + curr.getDate() + " " + curr.toLocaleTimeString() + "." + curr.getMilliseconds() + "][PID: " + process.pid + "]" + msg);
    if (error)
        console.log(error);
}

// 字符串检测
function IsNullOrEmpty(str) 
{
    return str === undefined || str === null || str == "";
}

function RespondError(resp, errorState, errMsg) {
    resp.writeHeader(util_constent.RESPONSE_STATE.ServerException_UnknownError, { 'Content-Type': 'text/html' });
    resp.end('ErrorCode:hahaha');
    return;
    if (errorState === undefined || errorState === null) {
        resp.end('ErrorCode:' + util_constent.RESPONSE_STATE.ServerException_UnknownError);
    } else if (errMsg === undefined || errMsg === null) {
        resp.end('ErrorCode:' + errorState);
    } else {
        resp.end('ErrorCode:' + errorState + '\n' + errMsg);
    }
}

exports.RespondError  = RespondError;
exports.ServerLog     = ServerLog;
exports.IsNullOrEmpty = IsNullOrEmpty;