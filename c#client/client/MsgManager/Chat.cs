using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace client.MsgManager
{
    class Chat
    {
        // 登录结果
        public static void Reg_MsgCallBack()
        {
            GameState.TcpClient.RegisterHandler((UInt16)MsgIds.MSG_CHAT, new TcpHandle.MsgCallBack(Recv_MSG_CHAT));
        }

        private static void Recv_MSG_CHAT(ReadMsg read)
        {
            UInt16 type =  read.ReadUInt16();
            string info = read.ReadString();
            Console.WriteLine(info);
            GameState.State.SetState(ELoginState.Login_Close);
        }

        public static void SendMsg_MSG_CHAT()
        {
        }
    }
}
