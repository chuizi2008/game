using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace client
{
    public enum ELoginState
    {
        Login_Wait = 0,
        Login_OK = 1,
        Login_Close = 2,
        Login_ERR,
    };

    public class LoginState
    {
        private Object GameStateLock = new Object();
        private ELoginState State;

        public void SetState(ELoginState val)
        {
            lock (GameStateLock)
                State = val;
        }

        public ELoginState GetState()
        {
            ELoginState val;
            lock (GameStateLock)
            {
                val = State;
                return val;
            }
        }
    }

    class GameState
    {
        public static string Account = "";
        public static string LoginKey = "";
        public static ELoginState LoginState = ELoginState.Login_Wait;
        public static TcpHandle TcpClient = null;
        public static LoginState State = new LoginState();
    };
}
