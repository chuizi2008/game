using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace client
{
    public class Test
    {
        public static UInt64 val = 0;
        public static UInt64 Man = 0;
    }

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

    public class GameState : LoginState
    {
        public string Account = "";
        public string LoginKey = "";
        public ELoginState LoginState = ELoginState.Login_Wait;
    };
}
