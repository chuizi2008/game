using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace client.MsgManager
{
    class Chat
    {
        public delegate void Chat_CallBack(string str);
        public static Chat_CallBack callBack = null;

        public static void Reg_Fun(Chat_CallBack fun)
        {
            callBack = fun;
        }

        public static void Recv_MSG_CHAT(TcpHandle client, ReadMsg read)
        {
            UInt16 type =  read.ReadUInt16();
            string info = read.ReadString();
            if (callBack != null)
                callBack(info);
        }

        public static void SendMsg_MSG_CHAT(TcpHandle client, string info)
        {
            WriteMsg msg = new WriteMsg((UInt16)MsgIds.MSG_CHAT);
            msg.WriteUInt16(1);
            msg.WriteString(info);
            client.Send(msg);
        }
    }
}
