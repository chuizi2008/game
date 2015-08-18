using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace client
{
    public class Game
    {
        public void Run()
        {
            while (true)
            {
                GameState.Account = "chuizi5";
                HTTP httpClient = new HTTP();
                int ret = httpClient.Login(GameState.Account, "1", ref GameState.LoginKey);
                if (ret == 1)
                {
                    // 注册
                    ret = httpClient.CreateAccount(GameState.Account, "1");
                    if (ret != 200)
                    {
                        Console.WriteLine("创建帐号失败");
                        return;
                    }
                    continue;
                }
                else if (ret == 3)
                {
                    ret = httpClient.CreateRole(GameState.Account, GameState.LoginKey, "LR");
                    if (ret != 200)
                    {
                        Console.WriteLine("创建角色失败");
                        return;
                    }
                }
                break;
            }

            GameState.TcpClient = new TcpHandle("192.168.1.191", 8888);
            MsgManager.Login.Reg_MsgCallBack();
            MsgManager.Chat.Reg_MsgCallBack();

            MsgManager.Login.SendMsg_MSG_LOGIN();

            while (GameState.TcpClient.CheckState() == TcpHandle.EConnectState.ConnectState_GameStart)
            {
                GameState.TcpClient.TickServerMsgTransfer();

                ELoginState val = GameState.State.GetState();
                if (val == ELoginState.Login_Close || val == ELoginState.Login_Wait)
                    break;
            }


            GameState.TcpClient.Close();
        }
    }
}
