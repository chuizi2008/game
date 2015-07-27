#include <nan.h>
using namespace v8;

#include "RedisClient.h"

extern "C"
{
#include "lua.h"
#include "lualib.h"
#include "lauxlib.h"
}

// 目前这个是单一的，可以考虑加入连接池
RedisClient mRedisClient;
NanCallback *outLog_Callback = NULL;
NanCallback *sysOutLog_Callback = NULL;
lua_State* luaMain = NULL;  

int OutLog(lua_State* L) 
{
	const char* str1 = lua_tostring(L,1);
	const char* str2 = lua_tostring(L,2);

	if (str1 == NULL ||  str2 == NULL || sysOutLog_Callback == NULL)
		return 0;

	Handle<Value> argv[] = {
		NanNew<String>(str1),
		NanNew<String>(str2)
	};

	outLog_Callback->Call(2, argv);
	return 0;
}

int SysOutLog(lua_State* L) 
{
	const char* str = lua_tostring(L,1);

	if (str == NULL || sysOutLog_Callback == NULL)
		return 0;

	Handle<Value> argv[] = {
		NanNew<String>(str),
	};

	sysOutLog_Callback->Call(1, argv);
	return 0;
}

int Redis_Open(lua_State* L)
{
	NanScope();

	const char* str = lua_tostring(L,1);
	bool ret = mRedisClient.TheBegin(str, 6379);

	lua_pushnumber(L, ret ? 1 : 0);
	return 1;
}

int Redis_Close(lua_State* L)
{
	mRedisClient.TheEnd();
	return 0;
}

int Redis_Get(lua_State* L)
{
	const char* str = lua_tostring(L,1);
	if (str == NULL)
	{
		lua_pushnumber(L, 0);
		return 1;
	}

	char szinfo[1024];
	memset(szinfo, 0, 1024);
	sprintf(szinfo, "hget roledbi acc_%s\r\n", str);

	bool ret = mRedisClient.Send(szinfo, strlen(szinfo));
	if (!ret)
		return 0;
	
	char* strRet = mRedisClient.Read_Get();
	if (strRet == NULL)
		return 0;

	lua_pushstring(L,  strRet);
	return 1;
}

int Redis_Set(lua_State* L)
{
	const char* str1 = lua_tostring(L, 1);
	const char* str2 = lua_tostring(L, 2);

	if (str1 == NULL || str2 == NULL)
	{
		lua_pushnumber(L, 0);
		return 1;
	}

	char szinfo[1024];
	memset(szinfo, 0, 1024);
	sprintf(szinfo, "hset roledbi acc_%s %s\r\n", str1, str2);
	bool ret = mRedisClient.Send(szinfo, strlen(szinfo));
	if (!ret)
		return false;

	lua_pushnumber(L, mRedisClient.Read_Set() ? 1 : 0);
	return 1;
}

NAN_METHOD(SetMsgCallback){

	NanScope();

	std::string myString(*NanAsciiString(args[0]));
	if (myString == "OutLog")
	{
		Local<Function> callbackHandle = args[1].As<Function>();
		if (outLog_Callback != NULL)
		{
			delete outLog_Callback;
			outLog_Callback = NULL;
		}

		outLog_Callback = new NanCallback(callbackHandle);
	}
	else if (myString == "SysOutLog")
	{
		Local<Function> callbackHandle = args[1].As<Function>();
		if (sysOutLog_Callback != NULL)
		{
			delete sysOutLog_Callback;
			sysOutLog_Callback = NULL;
		}

		sysOutLog_Callback = new NanCallback(callbackHandle);
	}


	NanReturnValue(NanNew<Uint32>(1));
}


NAN_METHOD(StartLua){

	NanScope();
	luaMain = luaL_newstate(); 
	if (luaMain == NULL) {
		NanReturnValue(NanNew<Uint32>(0));
	}

	luaL_openlibs(luaMain);

	// 信息回调函数
	lua_register(luaMain, "OutLog", OutLog);
	lua_register(luaMain, "SysOutLog", SysOutLog);

	lua_register(luaMain, "Redis_Open", Redis_Open);
	lua_register(luaMain, "Redis_Close", Redis_Close);
	lua_register(luaMain, "Redis_Get",    Redis_Get);
	lua_register(luaMain, "Redis_Set",    Redis_Set);

	NanReturnValue(NanNew<Uint32>(1));
}

NAN_METHOD(StopLua){
    NanScope();
	lua_close(luaMain);
    NanReturnValue(NanNew<Uint32>(1));
}

NAN_METHOD(DoFile){
    NanScope();

	if (luaMain == NULL)
		NanReturnValue(NanNew<Uint32>(0));

	std::string myString(*NanAsciiString(args[0]));

	int ret = luaL_dofile(luaMain, myString.c_str());
	if ( ret != 0 )
	{
		LPCSTR str = lua_tostring(luaMain, -1);
		if ( str )
		{
			Handle<Value> argv[] = {
				NanNew<String>(str),
			};

			sysOutLog_Callback->Call(1, argv);
		}

		myString = myString + " load error";
		Handle<Value> argv[] = {
			NanNew<String>(myString),
		};

		sysOutLog_Callback->Call(1, argv);
		NanReturnValue(NanNew<Uint32>(0));
	}

	NanReturnValue(NanNew<Uint32>(1));
}

NAN_METHOD(DoFun){
    NanScope();

	std::string myString(*NanAsciiString(args[0]));
	std::string value(*NanAsciiString(args[1]));

	lua_getglobal(luaMain,  myString.c_str());  
	lua_pushlstring(luaMain, value.c_str(), value.length());
    int ret = lua_pcall(luaMain, 1, LUA_MULTRET, 0);  
	if ( ret != 0 )
	{
		LPCSTR str = lua_tostring(luaMain, -1 );
		if ( str )
		{
			Handle<Value> argv[] = {
				NanNew<String>(str),
				NanNew<String>("404")
			};

			outLog_Callback->Call(2, argv);
		}
	}
}

void Init(Handle<Object> exports){
	exports->Set(NanNew<String>("SetMsgCallback"), NanNew<FunctionTemplate>(SetMsgCallback)->GetFunction());

	exports->Set(NanNew<String>("StartLua"), NanNew<FunctionTemplate>(StartLua)->GetFunction());
	exports->Set(NanNew<String>("StopLua"), NanNew<FunctionTemplate>(StopLua)->GetFunction());
	exports->Set(NanNew<String>("DoFile"),	 NanNew<FunctionTemplate>(DoFile)->GetFunction());
	exports->Set(NanNew<String>("DoFun"),	 NanNew<FunctionTemplate>(DoFun)->GetFunction());
}
 
NODE_MODULE(hello, Init);