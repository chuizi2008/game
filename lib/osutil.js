function ServerLog(msg, error) {
	var curr = new Date();
	console.log("[" + curr.getFullYear() + "/" + (curr.getMonth() + 1) + "/" + curr.getDate() + " " + curr.toLocaleTimeString() + "." + curr.getMilliseconds() + "]" + msg);
	if (error)
		console.log(error);
};

exports.ServerLog = ServerLog;
/*
var ursa = require('ursa');
var fs = require('fs');
var path = require('path');
var https = require("https");
var mysql = require('mysql');
var uuid = require('node-uuid');
var memcache = require('./memcache');

// 错误代码的常量数据，和客户端的osServerConnector.RESPONSE_STATE相对应
var RESPONSE_STATE = {
	OK															: 0,
	Busy														: 1000, // 客户端正在进行其他的通信操作，这个不会出现在服务器端
	WWWError													: 2000, // Unity的www报的错误，比如没有网，没连上服务器，或者通信失败，这个不会出现在服务器端
	WWWError_ConnectTimeout										: 2999,
	InvalidRequest												: 3000, // 传给服务器的参数有问题，找不到帐号或者登陆超时
	InvalidRequest_AccountLocked								: 3001, // 账号被锁定
	InvalidRequest_SessionTimeout								: 3002, // 登录超时
	InvalidRequest_UserNameIsUsed								: 3003, // 用户名已被占用
	InvalidRequest_AccountNotFound								: 3004, // 帐号不存在
	InvalidRequest_PasswordNotMatch								: 3005, // 密码错误
	InvalidRequest_MoneyIsNotEnough								: 3006, // 钱不够，这个错误后面会跟具体的货币类型代码
	InvalidRequest_FuelIsNotEnough								: 3007, // 燃料不够
	InvalidRequest_FuelIsFull									: 3008, // 燃料已经满了不需要花钱买
	InvalidRequest_ResearchIsAlreadyCompleted					: 3010, // 研发步骤完成之后收到了加速的请求
	InvalidRequest_ResearchEventIsNotDealtWith					: 3011, // 研发中的随机事件还没解决的情况下收到了其他请求
	InvalidRequest_ResearchIsNotComplete						: 3012, // 还未完成的步骤收到了确认的请求
	InvalidRequest_DataLostOrCrashError							: 3100, // 请求数据丢失或损坏等非人为错误
	InvalidRequest_ParamIsNull									: 3101,
	InvalidRequest_InvalidParamFormat							: 3102,
	InvalidRequest_AccountDataDecodeFailed						: 3103,
	InvalidRequest_AccountDataFormatError						: 3104,
	InvalidRequest_PlaneIsAcquired								: 3105,
	InvalidRequest_PilotIsAcquired								: 3106,
	InvalidRequest_InvalidPlaneId								: 3107,
	InvalidRequest_PlaneDataNotFound							: 3108,
	InvalidRequest_PartDataNotFound								: 3109,
	InvalidRequest_InvalidStepData								: 3110,
	InvalidRequest_AccelerationTimesUsedUp						: 3111,
	InvalidRequest_MissionIsLocked								: 3112,
	InvalidRequest_IapError										: 3500,	// 付费充值相关的非人为错误
	InvalidRequest_ReceiptIsNull								: 3501,
	InvalidRequest_InvalidBundleId								: 3502,
	InvalidRequest_ReceiptIsInvalid								: 3503,
	InvalidResponse												: 4000, // 服务器传回来的结果通不过验证，这个不会出现在服务器端
	InvalidResponse_DataFormatError								: 4001,
	InvalidResponse_DataVerifyFailed							: 4002,
	InvalidResponse_InvalidAccountID							: 4003,
	InvalidResponse_DataLost									: 4004,
	InvalidStaticData											: 5000, // 服务器端的静态数据有错误
	InvalidStaticData_PlaneStaticDataNotFound					: 5001,
	InvalidStaticData_PartStaticDataNotFound					: 5002,
	InvalidStaticData_WeaponGroupNotFound						: 5003,
	InvalidStaticData_PayloadGroupNotFound						: 5004,
	InvalidStaticData_ResearchStepNotFound						: 5005,
	InvalidStaticData_LevelUpDataNotFound						: 5006,
	ServerException												: 6000, // 服务器执行出现了异常
	ServerException_GetAccountDataFailed_Cache					: 6001,
	ServerException_GetAccountDataFailed_DB						: 6002,
	ServerException_SetAccountDataFailed_Cache					: 6003,
	ServerException_SetAccountDataFailed_DB						: 6004,
	ServerException_InsertAccountRecordFailed					: 6005,
	ServerException_CreateSessionFailed							: 6006,
	ServerException_GetSessionFailed							: 6007,
	ServerException_RefreshSessionFailed						: 6008,
	ServerException_GetUserDataFailed_Cache						: 6009,
	ServerException_GetUserDataFailed_DB						: 6010,
	ServerException_GetPlaneDataFailed_Cache					: 6011,
	ServerException_GetPlaneDataFailed_DB						: 6012,
	ServerException_GetPilotDataFailed_Cache					: 6013,
	ServerException_GetPilotDataFailed_DB						: 6014,
	ServerException_SetUserDataFailed_Cache						: 6015,
	ServerException_SetUserDataFailed_DB						: 6016,
	ServerException_RefreshUserDataCacheFailed					: 6017,
	ServerException_AppendSyncListFailed						: 6018, // 这个在客户端不会出现
	ServerException_InsertPlaneRecordFailed						: 6019,
	ServerException_InsertPilotRecordFailed						: 6019,
	ServerException_LoadMissionRecordFailed						: 6020, // 这个在客户端不会出现
	ServerException_LoadQuestRecordFailed						: 6021, // 这个在客户端不会出现
	ServerException_LoadRewardRecordFailed						: 6022, // 这个在客户端不会出现
	ServerException_IapError									: 6100,
	ServerException_AppleVerifyResponseNotReceived				: 6101,
	ServerException_CheckIapLogRecordFailed						: 6102,
	ServerException_InsertIapLogRecordFailed					: 6103,
	
	ServerException_UnknownError								: 6999 // 未知错误
};
exports.RESPONSE_STATE = RESPONSE_STATE;

function RespondError(resp, errorState, errMsg) {
	if (errorState === undefined || errorState === null) {
		resp.end('ErrorCode:' + ServerException_UnknownError);
	} else if (errMsg === undefined || errMsg === null) {
		resp.end('ErrorCode:' + errorState);
	} else {
		resp.end('ErrorCode:' + errorState + '\n' + errMsg);
	}
}
exports.RespondError = RespondError;

var cache = null;
var dbconn = null;
var MysqlConnectOK = false;
var CacheConnectOK = false;
function ConnectDataBase(dbconf) {
	
	// 连接memcache
	cache = new memcache.Client(dbconf.cachePort, dbconf.cacheHost);
	cache.on('connect', function(){
		ServerLog("pid: " + process.pid + " Memcache (" + cache.host + ":" + cache.port + ") connect OK");
		CacheConnectOK = true;
	});
	cache.on('close', function(){
		CacheConnectOK = false;
		ServerLog("pid: " + process.pid + " Memcache conn(" + cache.host + ":" + cache.port +  ") closed, restart...");
		cache.connect();
	});
	cache.on('timeout', function(){
		CacheConnectOK = false;
		ServerLog("pid: " + process.pid + " Memcache conn(" + cache.host + ":" + cache.port +  ") timeout, restart...");
		cache.connect();
	});
	cache.on('error', function(e){
		CacheConnectOK = false;
		ServerLog("pid: " + process.pid + " Memcache conn(" + cache.host + ":" + cache.port +  ") error, restart...", e);
		cache.connect();
	});

	cache.connect();
	
	// 连接数据库
	function handleDisconnect(connection) {
		// 数据库断线重连的逻辑
		connection.on('error', function(err) {
			if (!err.fatal)
				return;
			MysqlConnectOK = false;

			if (err.code !== 'PROTOCOL_CONNECTION_LOST')
				throw err;

			ServerLog('Re-connecting lost connection: ' + err.stack);

			dbconn = mysql.createConnection(dbconf);
			handleDisconnect(dbconn);
			dbconn.connect(function(err) {
				if (err) {
					ServerLog("pid: " + process.pid + (err.fatal ? " Fatal Error(Connection" + dbconf.host + ":" + dbconf.port + ") " : " Error(Connection" + dbconf.host + ":" + dbconf.port + ") ") + err.code + "\r\n" + err.message);
				} else {
					ServerLog("pid: " + process.pid + " MySql (" + dbconf.host + ":" + dbconf.port + ") Connect OK");
					MysqlConnectOK = true;
				}
			});
		});
	}
	dbconn = mysql.createConnection(dbconf);
	handleDisconnect(dbconn);
	dbconn.connect(function(err) {
		if (err) {
			ServerLog("pid: " + process.pid + (err.fatal ? " Fatal Error(Connection" + dbconf.host + ":" + dbconf.port + ") " : " Error(Connection" + dbconf.host + ":" + dbconf.port + ") ") + err.code + "\r\n" + err.message);
		} else {
			ServerLog("pid: " + process.pid + " MySql (" + dbconf.host + ":" + dbconf.port + ") Connect OK");
			MysqlConnectOK = true;
		}
	});
}

function IsNullOrEmpty(str) {
	return str === undefined || str === null || str == "";
};

function Ms2Date(ms) {
	var date = new Date();
	date.setTime(ms);
	return date;
};

function GetCurrTime() {
	var date = new Date()
	return date.getTime();
}

// RSA相关的函数
// openssl genrsa -aes128 -out default.pem -passout pass:xxxxxxxx 1024
// openssl rsa -in default.pem -out pub.pem -text -passin pass:xxxxxxxx -pubout
var DefaultRsaPrivateKey;
if (fs.existsSync("./default.pem"))
	DefaultRsaPrivateKey = ursa.createPrivateKey(fs.readFileSync("./default.pem", "utf8"), "MfIap2012");
else
	DefaultRsaPrivateKey = ursa.createPrivateKey(fs.readFileSync("../config/default.pem", "utf8"), "MfIap2012");
function Encrypt(utf8Data) {
	try {
		// 使用ursa.RSA_PKCS1_PADDING是为了配合.net，默认的ursa.RSA_PKCS1_OAEP_PADDING会报错
		return DefaultRsaPrivateKey.encrypt(utf8Data, "utf8", "base64", ursa.RSA_PKCS1_PADDING);
	} catch(err) {
		//ServerLog("Encrypt Error", err.description);
		return null;
	}
};
function Decrypt(base64Data) {
	try {
		// 使用ursa.RSA_PKCS1_PADDING是为了配合.net，默认的ursa.RSA_PKCS1_OAEP_PADDING会报错
		return DefaultRsaPrivateKey.decrypt(base64Data, "base64", "utf8", ursa.RSA_PKCS1_PADDING);
	} catch(err) {
		//ServerLog("Decrypt Error", err);
		return null;
	}
};
function Sign(strData) {
	try {
		return DefaultRsaPrivateKey.hashAndSign("sha1", strData, "utf8", "base64");
	} catch(err) {
		//ServerLog("Sign Error", err.description); // 避免连续接到错误数据导致日志量过快增长
		return null;
	}
};
function Verify(strData, signData) {
	try {
		var verifier = ursa.createVerifier("sha1");
		verifier.update(strData, "utf8");
		return verifier.verify(DefaultRsaPrivateKey, signData, "base64");
	} catch(err) {
		//ServerLog("Verify Error", err.description);
		return false;
	}
};

//创建帐号，要求传入加密后的udid|user_name|password，校验通过后会调用callback，传入参数udid, user_name, accountId
function CreateAccount(accountdata, remoteAddr, resp, callback) {
	var accountdataDecrypt = Decrypt(accountdata);
	if (accountdataDecrypt === null){
		RespondError(resp, RESPONSE_STATE.InvalidRequest_AccountDataDecodeFailed);
		return;
	}
	var accountdataArr = accountdataDecrypt.split('|');
	if (accountdataArr.length < 3) {
		RespondError(resp, RESPONSE_STATE.InvalidRequest_AccountDataFormatError);
		return;
	}
	var udid = accountdataArr[0];
	var user_name = accountdataArr[1];
	var password = accountdataArr[2];
	
	// 在缓存里查一下是不是重名
	cache.get('a_' + user_name, function(error, responseObj) {
		if (error){
			ServerLog('Error: Get account data failed(Cache)', error);
			RespondError(resp, RESPONSE_STATE.ServerException_GetAccountDataFailed_Cache, error.message);
			return;
		}
		if (!IsNullOrEmpty(responseObj)) {
			RespondError(resp, RESPONSE_STATE.InvalidRequest_UserNameIsUsed);
			
			return;
		}
		dbconn.query("INSERT INTO account SET user_name = ?, password = ?, reg_time = now(), last_login_time = now(), reg_ip = ?, udid = ?, silver = 0, gold = 500, crate = 10, cigarette = 5, fuel = 30, level=1, id_board='0,0,1', faction=1, missions = '1', achieved_items='0|0,1,3', energy=100, activity_times='0,0,0,0,0' ,last_check_time= now()",
				[user_name, password, remoteAddr, udid], function(err, result) {
			if (err) {
				if (err.code === 'ER_DUP_ENTRY') {
					RespondError(resp, RESPONSE_STATE.InvalidRequest_UserNameIsUsed);
				} else {
					ServerLog('Error: insert account record failed', err);
					RespondError(resp, RESPONSE_STATE.ServerException_InsertAccountRecordFailed, err.code + '\r\n' + err.message);
				}
			} else {
				callback(udid, user_name, result.insertId);
			}
		});
	});
};

//验证帐号合法性，要求传入加密后的udid|username|password，校验通过后会调用callback，传入参数udid, username, accountId
function CheckAccount(accountdata, resp, callback) {
	var accountdataDecrypt = Decrypt(accountdata);
	if (accountdataDecrypt === null){
		RespondError(resp, RESPONSE_STATE.InvalidRequest_AccountDataDecodeFailed);
		return;
	}
	var accountdataArr = accountdataDecrypt.split('|');
	if (accountdataArr.length < 3) {
		RespondError(resp, RESPONSE_STATE.InvalidRequest_AccountDataFormatError);
		return;
	}
	var udid = accountdataArr[0];
	var user_name = accountdataArr[1];
	var password = accountdataArr[2];
	// 先查缓存
	cache.get('a_' + user_name, function(error, responseObj) {
		if (error){
			ServerLog('Error: Get account data failed(Cache)', error);
			RespondError(resp, RESPONSE_STATE.ServerException_GetAccountDataFailed_Cache, error.message);
			return;
		}
		if (IsNullOrEmpty(responseObj)) {
			// 缓存里没找到，查数据库
			dbconn.query('SELECT idaccount, password, udid, locked FROM account WHERE user_name = ?', [user_name], function(err, result) {
				if (err) {
					ServerLog('Error: Get account data failed(DB)', err);
					RespondError(resp, RESPONSE_STATE.ServerException_GetAccountDataFailed_DB, err.code + '\r\n' + err.message);
				} else if (result === null || result.length == 0) {
					RespondError(resp, RESPONSE_STATE.InvalidRequest_AccountNotFound);
				} else {
					// 写缓存
					cache.set('a_' + user_name, JSON.stringify(result[0]), function(error){
						if(error) {
					    	ServerLog('Error: Set account data failed(Cache)', error);
					    	RespondError(resp, RESPONSE_STATE.ServerException_SetAccountDataFailed_Cache, error.message);
					        return;
					    }
						if (result[0].password === password) {
							if (result[0].locked === '1') {
								RespondError(resp, RESPONSE_STATE.InvalidRequest_AccountLocked);
								return;
							}
							callback(result[0].udid, result[0].user_name, result[0].idaccount);
						} else {
							RespondError(resp, RESPONSE_STATE.InvalidRequest_PasswordNotMatch);
						}
					});
				}
			});
		} else {
			var accountData = eval("(" + responseObj + ")");
			if (accountData.password === password) {
				if (accountData.locked === '1') {
					RespondError(resp, RESPONSE_STATE.InvalidRequest_AccountLocked);
					return;
				}
				callback(accountData.udid, accountData.user_name, accountData.idaccount);
			} else {
				RespondError(resp, RESPONSE_STATE.InvalidRequest_PasswordNotMatch);
			}
		}
	});		
};

//设置Session，设置之后调用callback并把sessionId作为参数传入
function SetSession(accountId, sessionTimeout, resp, callback) {
	var sessionId = uuid.v1();
	cache.set('s_' + sessionId, accountId, function(error){
	    if(error) {
	    	ServerLog('Error: Create Session Failed', error.message);
	    	RespondError(resp, RESPONSE_STATE.ServerException_CreateSessionFailed, error.message);
	        return;
	    }
	    callback(sessionId);
	}, sessionTimeout);
};

//检查Session超时，未超时则调用callback并把用户ID作为参数传入
function CheckSessionTimeout(sessionId, sessionTimeout, resp, callback) {
	if (IsNullOrEmpty(sessionId)) {
		RespondError(resp, RESPONSE_STATE.InvalidRequest_ParamIsNull, 'SessionId');
	} else {
		cache.get('s_' + sessionId, function(error, responseObj) {
			if (error){
				ServerLog('Error: Get Session Failed', error);
				RespondError(resp, RESPONSE_STATE.ServerException_GetSessionFailed, error.message);
				return;
			}
			if (IsNullOrEmpty(responseObj)) {
				RespondError(resp, RESPONSE_STATE.InvalidRequest_SessionTimeout);
			} else {
				cache.set('s_' + sessionId, responseObj, function(error){
					if(error) {
				    	ServerLog('Error: Refresh Session Failed', error);
				    	RespondError(resp, RESPONSE_STATE.ServerException_RefreshSessionFailed, error.message);
				        return;
				    }
					callback(responseObj);
				}, sessionTimeout);
			}
		});		
	}
};

//获取用户数据，获取到之后调用callback，将用户数据作为参数传入，注意这里不检测传入的accountId是否为空或者是否合法
function GetUserData(accountId, resp, callback) {
	cache.get('u_' + accountId, function(error, responseObj) {
		if (error){
			ServerLog('Error: Get user data failed(Cache)', error);
			RespondError(resp, RESPONSE_STATE.ServerException_GetUserDataFailed_Cache, error.message);
			return;
		}
		if (IsNullOrEmpty(responseObj)) {
			// 缓存里没找到，查数据库
			dbconn.query('SELECT * FROM account WHERE idaccount = ?', [accountId], function(err, result) {
				if (err) {
					ServerLog('Error: Get user data failed(DB)', err);
					RespondError(resp, RESPONSE_STATE.ServerException_GetUserDataFailed_Cache, err.code + '\r\n' + err.message);
				} else if (result === null || result.length == 0) {
					RespondError(resp, RESPONSE_STATE.InvalidRequest_AccountNotFound, accountId);
				} else {
					var userData = result[0];
					// 删掉敏感数据
					userData.idaccount = undefined;
					userData.password = undefined;
					userData.reg_time = undefined;
					userData.reg_ip = undefined;
					userData.udid = undefined;
					userData.locked = undefined;
					userData.PlaneList = [];
                    userData.PilotList = [];
					// 提取飞机数据
					dbconn.query('SELECT * FROM plane WHERE idaccount = ? ORDER BY idplane', [accountId], function(err, result) {
						if (err) {
							ServerLog('Error: Get plane data failed(DB)', err);
							RespondError(resp, RESPONSE_STATE.ServerException_GetPlaneDataFailed_DB, err.code + '\r\n' + err.message);
						} else {
							for(var key in result) {
								result[key].insert_time = Math.floor(result[key].insert_time.getTime() / 1000);
								userData.PlaneList.push(result[key]);
							}		
		                    // 提取飞行员数据
		                    dbconn.query('SELECT * FROM pilot WHERE idaccount = ? ORDER BY idpilot', [accountId], function(err, result) {
								if (err) {
									ServerLog('Error: Get pilot data failed(DB)', err);
									RespondError(resp, RESPONSE_STATE.ServerException_GetPilotDataFailed_DB, err.code + '\r\n' + err.message);
								} else {
									for(var key in result) {
										userData.PilotList.push(result[key]);
									}
									// 放到缓存里
									cache.set('u_' + accountId, JSON.stringify(userData), function(error){
										if(error) {
									    	ServerLog('Error: Set user data failed(Cache)', error);
									    	RespondError(resp, RESPONSE_STATE.ServerException_SetUserDataFailed_Cache, error.message);
									        return;
									    }
										callback(userData);
									});				
								}
							});	
						}
					});
				}
			});
		} else {
			var userData = eval("(" + responseObj + ")");
			userData.last_login_time = new Date(userData.last_login_time);
			cache.add('u_' + accountId, responseObj, function(error){
				if(error) {
					if (error.message.indexOf("NOT_STORED") < 0) {
				    	ServerLog("Error: Refresh user data cache failed", message);
				    	RespondError(resp, RESPONSE_STATE.ServerException_RefreshUserDataCacheFailed, error.message);
				        return;
					}
			    }
				callback(userData);
			});				
		}
	});
};

//修改用户数据，修改成功后调用callback
function UpdateUserData(accountId, planes, pilots, userData, resp, callback) {
	userData.last_login_time = new Date();
	cache.set('u_' + accountId, JSON.stringify(userData), function(error){
		if (error) {
	    	ServerLog('Error: Set user data failed(Cache)', error);
	    	RespondError(resp, RESPONSE_STATE.ServerException_SetUserDataFailed_Cache, error.message);
	        return;
	    }
		var syncKey = accountId;
		if (planes !== undefined && planes !== null && planes.length > 0)
			syncKey += '|' + planes.join('|');
        if (pilots !== undefined && pilots !== null && pilots.length > 0)
            syncKey += '@' + pilots.join('|');
		cache.append('synclist' + (new Date()).getMinutes() % 6, syncKey + ' ', function(error){
			if (error) {
				ServerLog("Error: Append SyncList Failed", error);
			}
		});
		callback();
	});
};

// 立即将指定的一个用户的缓存数据写入数据库，成功后调用callback
function FlushUserData(accountId, userData, resp, callback) {
	dbconn.query('UPDATE account SET quizcount = ?, quizcountwin = ?, extradata = ? WHERE idaccount = ?',
			[userData.quizkey, userData.quizstar, userData.unlockedattr, userData.vip, userData.unlockedcount, userData.unlockedcountvip, userData.quizcount, userData.quizcountwin, userData.extradata, accountId], function(err, result) {
		if (err) {
			ServerLog('Error: Set user data failed(DB)', err);
			RespondError(resp, RESPONSE_STATE.ServerException_SetUserDataFailed_DB, err.code + '\r\n' + err.message);
		}
		callback();
	});				
};

// 向数据库中插入一架飞机，要求传入用户ID，新飞机的数据和玩家数据，成功后会更新玩家数据，并以玩家数据作为参数调用callback
function InsertPlane(accountId, planeData, userData, resp, callback) {
	dbconn.query('INSERT INTO plane SET idaccount = ?, plane_id = ?, pilot_id = ?, part = ?, insert_time = now(), status=?,step=?,develop_time=?,consumed_time=?,event_id=?,event_status=?,emit_time=?,level_up_record=?',
			[accountId, planeData.plane_id, planeData.pilot_id, planeData.part, planeData.status,planeData.step,planeData.develop_time,planeData.consumed_time,planeData.event_id,planeData.event_status,planeData.emit_time,planeData.level_up_record], function(err, result) {
		if (err) {
			if (err.code === 'ER_DUP_ENTRY') {
				RespondError(resp, RESPONSE_STATE.InvalidRequest_PlaneIsAcquired);
			} else {
				ServerLog('Error: Insert plane record failed', err);
				RespondError(resp, RESPONSE_STATE.ServerException_InsertPlaneRecordFailed, err.code + '\r\n' + err.message);
			}
		} else {
			planeData.idplane = result.insertId;
			planeData.insert_time = Math.floor(GetCurrTime() / 1000);
			userData.PlaneList.push(planeData);
			UpdateUserData(accountId, [planeData.plane_id], null, userData, resp, function() {
				callback(userData);
			});
		}
	});
};

// 向数据库中插入一个飞行员，要求传入用户ID，新飞行员的数据和玩家数据，成功后会更新玩家数据，并以玩家数据作为参数调用callback
function InsertPilot(accountId, pilotData, userData, resp, callback) {
	dbconn.query('INSERT INTO pilot SET pilotid = ?, idaccount = ?, level = ?, inserttime = now()',
			[pilotData.pilotid, accountId,pilotData.level], function(err, result) {
		if (err) {
			if (err.code === 'ER_DUP_ENTRY') {
				RespondError(resp, RESPONSE_STATE.InvalidRequest_PilotIsAcquired);
			} else {
				ServerLog('Error: Insert pilot record failed', err);
				RespondError(resp, RESPONSE_STATE.ServerException_InsertPilotRecordFailed, err.code + '\r\n' + err.message);
			}
		} else {
			pilotData.idpilot = result.insertId;
			//pilotData.inserttime = Math.floor(GetCurrTime() / 1000);
			userData.PilotList.push(pilotData);
			UpdateUserData(accountId, null, [pilotData.pilotid], userData, resp, function() {
				callback(userData);
			});
		}
	});
};


//获取奖励
function AcceptReward(userData, rewardType, count) {
	switch (rewardType) {
	case REWARD_TYPE.Silver:
		userData.silver += count;
		break;
	case REWARD_TYPE.Gold:
		userData.gold += count;
		break;
	case REWARD_TYPE.Cigarette:
		userData.cigarette += count;
		break;
	case REWARD_TYPE.Crate:
		userData.crate += count;
		break;
	case REWARD_TYPE.Scrap:
		userData.scrap += count;
		break;
	case REWARD_TYPE.SalvagePart:
		userData.salvage_part += count;
		break;
	case REWARD_TYPE.Urgent:
		userData.urgent += count;
		break;
	case REWARD_TYPE.Voucher:
		userData.voucher += count;
		break;
	default:
		break;
	}
}

function RandomReward(rewardSrc) {
	var reward = {};
	reward.type1 = rewardSrc.type1;
	reward.count1 = 0;
	if (rewardSrc.type1 > 0 && (rewardSrc.probability1 >= 1 || Math.random() < rewardSrc.probability1))
		reward.count1 = RandomBetween(rewardSrc.min1, rewardSrc.max1) * rewardSrc.unit1;

	reward.type2 = rewardSrc.type2;
	reward.count2 = 0;
	if (rewardSrc.type2 > 0 && (rewardSrc.probability2 >= 1 || Math.random() < rewardSrc.probability2))
		reward.count2 = RandomBetween(rewardSrc.min2, rewardSrc.max2) * rewardSrc.unit2;
	
	return reward;
}

function RandomRewardFromList(rewardSrcList) {
	var reward = {};
	reward.type1 = 0;
	reward.count1 = 0;
	reward.type2 = 0;
	reward.count2 = 0;
	
	var idxRandomValue = Math.random();
	for (var i in rewardSrcList) {
		var rewardSrc = rewardSrcList[i];
		if (idxRandomValue >= rewardSrc.probability1) {
			idxRandomValue -= rewardSrc.probability1;
		} else {
			reward.type1 = rewardSrc.type1;
			reward.count1 = 0;
			if (rewardSrc.type1 > 0)
				reward.count1 = RandomBetween(rewardSrc.min1, rewardSrc.max1) * rewardSrc.unit1;

			reward.type2 = rewardSrc.type2;
			reward.count2 = 0;
			if (rewardSrc.type2 > 0)
				reward.count2 = RandomBetween(rewardSrc.min2, rewardSrc.max2) * rewardSrc.unit2;
			
			break;
		}
	}
	
	return reward;
}

function _SendReceipt(iapMode, resp, receipt, callback) {
	var options = {
		hostname: iapMode + '.itunes.apple.com',
		path: '/verifyReceipt',
		method: 'POST',
		headers: {"content-type" : "application/json"}
	};
	//ServerLog("verifyReceipt " + options.hostname);
	var appleReq = https.request(options, function(appleResp) {
		appleResp.setEncoding('utf8');
		var appleRespData = "";
		appleResp.on('data', function (chunk) {
			appleRespData += chunk;
		});
		appleResp.on('end', function () {
			var respObj = eval("(" + appleRespData + ")");
			//ServerLog(appleRespData);
			if (iapMode == "buy" && respObj.status == 21007) {
				_SendReceipt("sandbox", resp, receipt, callback);
			} else if (respObj.status == 0){
				callback(respObj, appleRespData);
			} else {
				RespondError(resp, RESPONSE_STATE.InvalidRequest_ReceiptIsInvalid);
			}
		});
	});
	appleReq.on('error', function(e) {
		ServerLog("Error: Apple verify response not received: " + e.message);
		RespondError(resp, RESPONSE_STATE.ServerException_AppleVerifyResponseNotReceived, e.message);
	});
	appleReq.write(JSON.stringify({"receipt-data": receipt}));
	appleReq.end();
}

// 验证苹果IAP收据，成功后调用callback，传入收据明文的对象，如果收据已经验证过了，则传入null
function CheckReceipt(resp, receipt, accountId, bid, callback) {
	if (IsNullOrEmpty(receipt)) {
		RespondError(resp, RESPONSE_STATE.InvalidRequest_ReceiptIsNull);
		return;
	}
	_SendReceipt("buy", resp, receipt, function(respObj, appleRespData) {
		if (bid != respObj.receipt.bid) {
			RespondError(resp, RESPONSE_STATE.InvalidRequest_InvalidBundleId);
			return;
		}
		var transid = respObj.receipt.transaction_id;
		var purchasedate = respObj.receipt.purchase_date_ms;
		var originalpurchasedate = respObj.receipt.original_purchase_date_ms;
		dbconn.query('SELECT transid FROM iaplog WHERE transid = ?', [transid + "|" + purchasedate], function(err, result) {
			if (err) {
				ServerLog("Error: Check iaplog record failed", err);
				RespondError(resp, RESPONSE_STATE.ServerException_CheckIapLogRecordFailed, err.code + '\r\n' + err.message);
			} else if (result !== null && result.length > 0) {
				callback(null);
			} else {
				dbconn.query('INSERT INTO iaplog SET transid = ?, accountid = ?, signtime = now()', [transid + "|" + purchasedate, accountId], function(err, result) {
					if (err) {
						ServerLog("Error: Insert iaplog record failed", err);
						RespondError(resp, RESPONSE_STATE.ServerException_InsertIapLogRecordFailed, err.code + '\r\n' + err.message);
					} else {
						dbconn.query('INSERT INTO log SET idaccount = ?, logtype = ?, logtime = now(), content = ?, var1 = ?',
								[accountId, purchasedate == originalpurchasedate ? 'Buy' : 'Restore', appleRespData, respObj.receipt.original_transaction_id], function(err, result) {
							if (err)
								ServerLog("Error: Wwrite log failed(CheckReceipt): " + err.code + "\r\n" + err.message);
						});
						callback(respObj.receipt);
					}
				});
			}
		});
	});
};


function FindRouteInDirectory(currentDir) {
	var actions = [];
	var files = fs.readdirSync(currentDir);

	for(var i in files) {
		var filepath = path.normalize(path.join(currentDir, files[i]));
		var fState = fs.statSync(filepath);

		if(fState.isDirectory()) {
			FindRouteInDirectory(filepath);
		} else {
			var reg = /route(\S+)route\.(\S+)\.js$/i;
			var captured = reg.exec(filepath);
			if(captured.length > 0) {
				var httpPath = (captured[1] + captured[2]).replace(/\\/g, '/');
				ServerLog("pid: " + process.pid + " Add request handler [" + filepath + "] to path [" + httpPath + "]");
				var routedModule = require('../' + filepath);
				actions[httpPath] = routedModule.action;
			}
		}
	}
	return actions;
};

function FindAdminRouteInDirectory(currentDir) {
	var actions = [];
	var files = fs.readdirSync(currentDir);

	for(var i in files) {
		var filepath = path.normalize(path.join(currentDir, files[i]));
		var fState = fs.statSync(filepath);

		if(fState.isDirectory()) {
			FindRouteInDirectory(filepath);
		} else {
			var reg = /route_admin(\S+)route\.(\S+)\.js$/i;
			var captured = reg.exec(filepath);
			if(captured.length > 0) {
				var httpPath = (captured[1] + captured[2]).replace(/\\/g, '/');
				ServerLog("pid: " + process.pid + " Add Admin request handler [" + filepath + "] to path [" + httpPath + "]");
				var routedModule = require('../' + filepath);
				actions[httpPath] = routedModule.action;
			}
		}
	}
	return actions;
};

// 加载当前阶段的关卡池
function LoadMissions() {
	dbconn.query('SELECT * FROM mission, config WHERE disabled = 0 ORDER BY idmission', null, function(err, result) {
		if (err) {
			ServerLog("Error: LoadMissions failed", err);
		} else {
			var MissionPool = [];
			var MissionDic = [];
			for(var key in result) {
				var type = parseInt(result[key].type);
				var difficulty = parseInt(result[key].difficulty);
				if (MissionPool[difficulty] === undefined || MissionPool[difficulty] === null)
					MissionPool[difficulty] = [];
				if (MissionPool[difficulty][type] === undefined || MissionPool[difficulty][type] === null)
					MissionPool[difficulty][type] = [];
				MissionPool[difficulty][type].push(result[key]);
				MissionDic[result[key].levelname] = result[key];
			}
			global.MissionPool = MissionPool;
			global.MissionDic = MissionDic;
			ServerLog("Missions " + result[0].campaignmap + " load complete\n" + JSON.stringify(global.MissionPool));
		}
	});
}

// 加载任务列表和奖励列表
function LoadQuestAndReward() {
	dbconn.query('SELECT * FROM quest ORDER BY idquest', null, function(err, result) {
		if (err) {
			ServerLog("Error: Load quest record failed", err);
		} else {
			var QuestPool = [];
			for(var key in result) {
				var level = parseInt(result[key].level);
				if (QuestPool[level] === undefined || QuestPool[level] === null)
					QuestPool[level] = [];
				QuestPool[level].push(result[key]);
			}
			dbconn.query('SELECT * FROM reward ORDER BY idreward', null, function(err, result) {
				if (err) {
					ServerLog("Error: Load reward record failed", err);
				} else {
					var RewardList = [];
					for(var key in result) {
						var mode = parseInt(result[key].mode);
						if (RewardList[mode] === undefined || RewardList[mode] === null)
							RewardList[mode] = [];
						RewardList[mode].push(result[key]);
					}
					global.QuestPool = QuestPool;
					global.RewardList = RewardList;
					ServerLog("LoadQuestAndReward complete\n" + JSON.stringify(global.QuestPool) + "\n" + JSON.stringify(global.RewardList));
				}
			});
		}
	});
}



//生成一个包含上下限的随机正整数，第三个参数是个数组，里面包含了不希望出现的数字
function RandomBetween(under, over, except){
	switch(arguments.length){
		case 1:
			return Math.floor(Math.random()*under+1);
		case 2:
			return Math.floor(Math.random()*(over-under+1) + under);
		case 3:
			var exceptClone = [];
			for (var i in except)
				if (except[i] >= under && except[i] <= over)
					exceptClone.push(except[i]);
			exceptClone.sort(sortNumber);
			over -= exceptClone.length;
			var result = Math.floor(Math.random()*(over-under+1) + under);
			for (var i in exceptClone)
				if (result >= exceptClone[i])
					result++;
			return result;
		default:
			return 0; 
	}
}
function sortNumber(a, b) {
	return a - b;
}


exports.RandomBetween = RandomBetween;
exports.IsNullOrEmpty = IsNullOrEmpty;
exports.Ms2Date = Ms2Date;
exports.GetCurrTime = GetCurrTime;
exports.ServerLog = ServerLog;
exports.Encrypt = Encrypt;
exports.Decrypt = Decrypt;
exports.Sign = Sign;
exports.Verify = Verify;
exports.ConnectDataBase = ConnectDataBase;
exports.DbConnectOK = function() { return MysqlConnectOK && CacheConnectOK; };
exports.GetDbConn = function() { return dbconn; };
exports.GetCache = function() { return cache; };
exports.CreateAccount = CreateAccount;
exports.CheckAccount = CheckAccount;
exports.SetSession = SetSession;
exports.CheckSessionTimeout = CheckSessionTimeout;
exports.GetUserData = GetUserData;
exports.UpdateUserData = UpdateUserData;
exports.FlushUserData = FlushUserData;
exports.InsertPlane = InsertPlane;
exports.InsertPilot = InsertPilot;

exports.AcceptReward = AcceptReward;
exports.RandomReward = RandomReward;
exports.RandomRewardFromList = RandomRewardFromList;
exports.CheckReceipt = CheckReceipt;
exports.LoadMissions = LoadMissions;
exports.LoadQuestAndReward = LoadQuestAndReward;
exports.FindRouteInDirectory = FindRouteInDirectory;
exports.FindAdminRouteInDirectory = FindAdminRouteInDirectory;

//常量定义区

// 游戏模式，和客户端的osConstants.BATTLE_MODE一致
var BATTLE_MODE = {
	SinglePlayer				: 0,
	ChainLevel					: 1,
	ChainLevel_LimitedTime		: 2,
	MultiPlayer_TeamDeathmatch	: 101,
	
	IsMultiPlayer : function(mode) { return mode > 100; }
};
exports.BATTLE_MODE = BATTLE_MODE;

// 阵营，和客户端的阵营常量定义一致
var FACTION = {
	NEUTRAL	: 0, // 中立，对于战斗结算来说，胜利的阵营这一参数如果是这个值，代表平局
	BLUE	: 1, // 蓝方
	RED		: 2  // 红方
};
exports.FACTION = FACTION;

// 奖励类型，和客户端的枚举osRewardType一致
var REWARD_TYPE = {
	None		: 0, // 无奖励
	Silver		: 1, // 银币
	Gold		: 2, // 金币
	Cigarette	: 3, // 钥匙
	Crate		: 4, // 宝箱
	Scrap		: 5, // 残骸
	SalvagePart	: 6, // 高级部件碎片
	Urgent		: 7, // 加速道具
	Voucher		: 8, // 消耗品代币
	Camaflouge	: 9  // 消耗性的涂装
};
exports.REWARD_TYPE = REWARD_TYPE;

// 随机奖励的模式，这个在客户端没有对应的定义
var REWARD_MODE = {
	SinglePlayerQuest			: 0,
	SinglePlayerTimeLimitQuest	: 1,
	MultiPlayerQuestLevel1		: 2,
	MultiPlayerQuestLevel2		: 3,
	MultiPlayerQuestLevel3		: 4,
	MultiPlayerTimeLimitQuest	: 5,
	Uncrate						: 6
};
exports.REWARD_MODE = REWARD_MODE;

//打多少场PVP飞行员获得所在飞机熟练驾驶
exports.PILOT_FLOWN_PROFICIENCY= 10;*/


