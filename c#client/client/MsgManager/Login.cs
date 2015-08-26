using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace client.MsgManager
{
    class Login
    {
        public static void Recv_MSG_LOGIN(TcpHandle tcp, ReadMsg read)
        {
            UInt16 ret =  read.ReadUInt16();

            if (1 != ret)
            {
                tcp.gameState.SetState(ELoginState.Login_ERR);
                Console.WriteLine("登陆失败(errno:" + ret + ")");
            }
            else
            {
                tcp.gameState.SetState(ELoginState.Login_OK);
                CountNum.AddOK(1);
            }
        }

        public static void SendMsg_MSG_LOGIN(TcpHandle tcp)
        {
            WriteMsg msg = new WriteMsg((UInt16)MsgIds.MSG_LOGIN);
            msg.WriteString(tcp.gameState.Account);
            msg.WriteString(tcp.gameState.LoginKey);
            tcp.Send(msg);
        }
    }
}
