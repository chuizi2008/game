using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Timers;
using System.Runtime.InteropServices;

namespace client
{
    class Program
    {
        [DllImport("kernel32")]
        static extern uint GetTickCount();

        static void Run()
        {
            Game obj = new Game();
            obj.Run();
        }

        static void Main(string[] args)
        {
            uint ret = GetTickCount();
            Run();
            Console.WriteLine(GetTickCount() - ret);
            Console.ReadKey(true);
        }
    }
}
