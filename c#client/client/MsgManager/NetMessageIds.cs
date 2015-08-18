using System;

namespace client.MsgManager
{
    public enum MsgIds
    {
        MSG_NONE,
        MSG_TIMELAPSE = 1,

        MSG_LOGIN  = 10,
        MSG_LOGOUT = 11,

        MSG_CHAT   = 10001,

        MSG_ERROR  = 65530,
        MSG_MAX    = 65530 + 1,
    }
}