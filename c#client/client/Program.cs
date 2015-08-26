using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Timers;
using System.Runtime.InteropServices;

namespace client
{
    class CountNum
    {
        static Object objLock = new Object();
        static public int okRet = 0;
        static public int errRet = 0;

        static public void AddOK(int ret)
        {
            lock (objLock)
                okRet += ret;
        }

        static public void AddErr(int ret)
        {
            lock (objLock)
                errRet += ret;
        }

        static public int GetRet()
        {
            int ret = 0;
            lock (objLock)
                ret = okRet + errRet;

            return ret;
        }
    };

    class Program
    {
        [DllImport("kernel32")]
        static extern uint GetTickCount();

        static void Run(object str)
        {
            int[] ret = new int[2];
            ret[0] = 0;
            ret[1] = 0;
            for (int n = 0; n < 1; n++)
            {
                Game obj = new Game();
                if (obj.Run((str as string) + n.ToString(), "1"))
                    ret[0]++;
                else
                    ret[1]++;
            }

            CountNum.AddOK(ret[0]);
            CountNum.AddErr(ret[1]);
        }

        static void Main(string[] args)
        {
            UInt64 max = 200;
            for (UInt64 n = 0; n < max; n++)
            {
                Thread thread = new Thread(new ParameterizedThreadStart(Run));
                thread.Start("chuizi100" + n);
            }

            while (CountNum.GetRet() < 100 * 99)
            {
                Thread.Sleep(1);
            }

            Console.WriteLine("OK:" + CountNum.okRet + "     /            ERR:" + CountNum.errRet);

            Console.ReadKey(true);
        }
    }
}
