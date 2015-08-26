using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace client.MsgManager
{
    class Login
    {
        public static void Recv_MSG_LOGIN(TcpHandle client, ReadMsg read)
        {
            UInt16 ret =  read.ReadUInt16();

            if (1 != ret)
            {
                client.gameState.SetState(ELoginState.Login_ERR);
                Debug.Log("登陆失败(errno:" + ret + ")");
            }
            else
            {
                client.gameState.SetState(ELoginState.Login_OK);
                Debug.Log("登陆成功");
            }
        }

        public static void SendMsg_MSG_LOGIN(TcpHandle client)
        {
            WriteMsg msg = new WriteMsg((UInt16)MsgIds.MSG_LOGIN);
            msg.WriteString(client.gameState.Account);
            msg.WriteString(client.gameState.LoginKey);
            client.Send(msg);
        }
    }
}
