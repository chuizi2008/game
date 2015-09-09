using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;

namespace client
{
    public class Game
    {
        public void chatcallback(string str)
        {
            Console.WriteLine(str);
        }

        public bool Run(string account, string password, string serverName)
        {
            string loginKey = null;

            while (true)
            {
                HTTP httpClient = new HTTP();
                int ret = httpClient.Login(account, "1", serverName, ref loginKey);
                if (ret == 1)
                {
                    // 注册
                    ret = httpClient.CreateAccount(account, "1");
                    if (ret != 200)
                    {
                        Console.WriteLine("创建帐号失败");
                        return false;
                    }
                    continue;
                }
                else if (ret == 3)
                {
                    return true;
                    ret = httpClient.CreateRole(account, loginKey, "LR");
                    if (ret != 200)
                    {
                        Console.WriteLine("创建角色失败");
                        return false;
                    }
                }
                else if (ret != 200)
                {
                    Console.WriteLine("登录异常:" + ret);
                }
                break;
            }

            if (loginKey == null)
            {
                //CountNum.errRet++;
                //Console.WriteLine("登录异常: loginKey == null");
                return false;
            }

            TcpHandle tcpClient = new TcpHandle("192.168.1.191", 8088);
            tcpClient.gameState.Account = account;
            tcpClient.gameState.LoginKey = loginKey;

            tcpClient.RegisterHandler((UInt16)MsgManager.MsgIds.MSG_LOGIN, new TcpHandle.MsgCallBack(MsgManager.Login.Recv_MSG_LOGIN));
            tcpClient.RegisterHandler((UInt16)MsgManager.MsgIds.MSG_CHAT, new TcpHandle.MsgCallBack(MsgManager.Chat.Recv_MSG_CHAT));

            MsgManager.Chat.Reg_Fun(new MsgManager.Chat.Chat_CallBack(chatcallback));
            MsgManager.Login.SendMsg_MSG_LOGIN(tcpClient);

            while (tcpClient.CheckState() == TcpHandle.EConnectState.ConnectState_GameStart)
            {
                Thread.Sleep(100);
                tcpClient.TickServerMsgTransfer();

                ELoginState val = tcpClient.gameState.GetState();
                if (val == ELoginState.Login_Close || val == ELoginState.Login_ERR)
                    break;
            }

            tcpClient.Close();
            return true;
        }
    }
}
