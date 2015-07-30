var d = document,
w = window,
p = parseInt,
dd = d.documentElement,
db = d.body,
dc = d.compatMode == 'CSS1Compat',
dx = dc ? dd: db,
ec = encodeURIComponent;
	
textarea_Fight = d.getElementById("textarea_Fight");
textarea_Count = d.getElementById("textarea_Count");
var button = new Array();
button[1]   = d.getElementById("test_1");
button[2]   = d.getElementById("test_2");
button[3]   = d.getElementById("test_3");
button[4]   = d.getElementById("test_4");
button[5]   = d.getElementById("test_5");
button[6]   = d.getElementById("test_6");
button[7]   = d.getElementById("test_7");

w.CHAT = {
	username:null,
	userid:null,
	socket:null,

	//读取cookies 
	test:function () 
	{ 
		alert("aaaaaaaaa");
	},
	
	CloseButton:function (isOpen)
	{
		for (var n = 1; n < button.length; n++)
			button[n].disabled = isOpen;
	},

	//退出，本例只是一个简单的刷新
	SendScan:function(){
		this.socket.emit('Scan');
	},
	
	SendTest:function(){
		this.socket.emit('Test');
	},
	
	SendRefreshScript:function(){
		this.socket.emit('RefreshScript');
	},
	
	//读取cookies 
	getCookie:function (name) 
	{ 
		var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
		
		if (arr=document.cookie.match(reg))
			return unescape(arr[2]); 
		else 
			return null; 
	},
	
	//退出，本例只是一个简单的刷新
	logout:function(){
		//this.socket.disconnect();
		location.reload();
	},

	init:function(username){
		/*
		客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
		实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
		*/
		this.account = this.getCookie("Account");
		this.LoginKey = this.getCookie("LoginKey");

		//连接websocket后端服务器
		this.socket = io.connect('192.168.1.191:8088');
		
		//告诉服务器端有用户登录
		this.socket.emit('login', {Account:this.account, LoginKey:this.LoginKey});
		
		// 战斗消息
		this.socket.on('loginRet', function(obj){
			if (obj.content != 'Y')
				logout();
		});
		
		//监听用户退出
		this.socket.on('logout', function(o){
			CHAT.updateSysMsg(o, 'logout');
		});
		
		this.socket.onerror = function(e){
			alert(e);
		}
		
		this.socket.onclose = function(e){
			alert(e);
		}
		
		this.socket.on('broadcast message', function(obj){
			alert(obj.content);
		});
		
		// 战斗开始
		this.socket.on('ScanBegin', function(){
			textarea_Fight.value = "";
			w.CHAT.CloseButton(true);
		});
		
		// 战斗结束
		this.socket.on('ScanEnd', function(){
			w.CHAT.CloseButton(false);
		});
		
		// 上部分的探索信息
		this.socket.on('Scan_Info', function(obj){
			textarea_Fight.value += decodeURIComponent(obj.content) + "\r\n";
			textarea_Fight.scrollTop = textarea_Fight.scrollHeight;
		});
		
		// 下面的角色信息
		this.socket.on('Count_Info', function(obj){
			var roleObj = JSON.parse(obj.jsonInfo);
			textarea_Count.value = "";
			textarea_Count.value += "帐号:    		" + roleObj.Account + "\r\n";
			textarea_Count.value += "职业:    		" + roleObj.Occupation + "\r\n";
			textarea_Count.value += "等级:    		" + roleObj.Level + "\r\n";
			textarea_Count.value += "行动力:  		" + roleObj.MovePoint + "\r\n";
			textarea_Count.value += "攻击等级:		" + roleObj.AttackLevel + "\r\n";
			textarea_Count.value += "防御等级:		" + roleObj.DeffineLevel + "\r\n";
			textarea_Count.value += "金币:   		" + roleObj.Gold + "\r\n";
		});
		
		// 异常消息
		this.socket.on('Err', function(obj){
			alert(obj.info);
		});
	}
};

w.CHAT.init('123');
