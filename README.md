最近没啥事干，并且想弄一个一劳永逸的手游服务器，所以搞了个node.js的服务器，目前所有手游游戏，除了ARPG，其他完全能应付。

等有空具体在写个详细模块说明

V2.5[2015-8-18]
HTTP部分POST换成了GET模式，速度提升了N倍。登录注册进入游戏一条龙只要50-60毫秒
TCP模块加了广播功能

V2.4[2015-8-13]
客服端模块整理规范了下.消息协议从JSON转到BYTE数组，JSON虽然方便省事，但是性能有点慢.
TcpManager为客服端SOCKET管理模块
MsgPacket   存储使用的消息包
TcpHandle   对外使用的管理器
WriteMsg    2进制消息写包
ReadMsg     2进制消息读包
下一步开始对接LUA部分了

V2.3[2015-8-12] 
socket.io 速度性能太差劲了。。。JS支持TCP，这东西多半只适合不太熟悉TCP的人使用吧
现在换成了TCP+JSON。。。99个单线程登录测试，耗时44秒，还是不太理想，找找性能消耗最大在那里

V2.2[2015-7-30] 
重复登录流程测试修正，C#客服端登录完善

V2.1[2015-7-30]
整理了JS登录流程部分，接下来做机器人跑跑看了

V2[2015-7-29]
JS前端部分重新整理规划了哈。勉强可以见人了。
客服端登录成功或者创建之后，回收到一个页面，手游需要截取第一行帐号:LoginKEY然后进行手动跳转，HTML通过JS自动操作。
还有不少BUG和细节需要完善，特别是重复登录，顶号的问题还需要给一个完善的解决方案
