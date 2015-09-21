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
        static UInt32 threadNum = 100;
        static UInt32 loopNum = 1;

        static void Run(object str)
        {
            Game obj = new Game();
            obj.Run(str as string, "1", "1");
        }

        static void Main(string[] args)
        {
            Random random = new Random();
            for (UInt32 n = 0; n < threadNum; n++)
            {
                Thread thread = new Thread(new ParameterizedThreadStart(Run));
               //  thread.Start("chuizi" + random.Next() % 100000);
                thread.Start("chuizi" + n);
            }

            while (CountNum.GetRet() < threadNum * loopNum)
            {
                Thread.Sleep(1);
            }

            Console.WriteLine("OK:" + CountNum.okRet + "     /            ERR:" + CountNum.errRet);

            Console.ReadKey(true);
        }
    }
}
