using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace client.MsgManager
{
    class Login
    {
        // 登录结果
        public static void Reg_MsgCallBack()
        {
            GameState.TcpClient.RegisterHandler((UInt16)MsgIds.MSG_LOGIN, new TcpHandle.MsgCallBack(Recv_MSG_LOGIN));
        }

        private static void Recv_MSG_LOGIN(ReadMsg read)
        {
            UInt16 ret =  read.ReadUInt16();

            if (1 != ret)
            {
                GameState.State.SetState(ELoginState.Login_ERR);
                Console.WriteLine("登陆失败(errno:" + ret + ")");
            }
            else
            {
                GameState.State.SetState(ELoginState.Login_OK);
            }
        }

        public static void SendMsg_MSG_LOGIN()
        {
            WriteMsg msg = new WriteMsg((UInt16)MsgIds.MSG_LOGIN);
            msg.WriteString(GameState.Account);
            msg.WriteString(GameState.LoginKey);
            GameState.TcpClient.Send(msg);
        }
    }
}
