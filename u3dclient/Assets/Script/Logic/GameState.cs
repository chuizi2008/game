using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

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
    public ELoginState LoginState = ELoginState.Login_Wait;

	private string strAccount = "";
	public string Account
	{
		get{
			return strAccount;
		}

		set{
			strAccount = value;
		}
	}

	private string strLoginKey = "";
	public string LoginKey
	{
		get{
			return strLoginKey;
		}
		
		set{
			strLoginKey = value;
		}
	}
};
