using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using Quobject.SocketIoClientDotNet.Client;
using Newtonsoft.Json.Linq;

namespace client
{
    class Program
    {
        public static ManualResetEvent mre = new ManualResetEvent(false);

        static void Main(string[] args)
        {
            Socket socket = IO.Socket("http://192.168.1.191:8088/");
            socket.On(Socket.EVENT_CONNECT, () =>
            {
                Console.WriteLine("EVENT_CONNECT");

                JObject obj = new JObject();
                obj["AccountID"] = "123";
                obj["LoginKey"] = "2212e7c0-343a-11e5-8317-038fd8415a01";
                socket.Emit("login", obj);
            });

            socket.On(Socket.EVENT_CONNECT_ERROR, () =>
            {
                Console.WriteLine("EVENT_CONNECT_ERROR");

            });

            socket.On("loginRet", (data) =>
            {
                if ((data as JObject)["content"].ToString() == "Y")
                    Console.WriteLine("login ok");
                else
                    Console.WriteLine("login err");
            });

            mre.WaitOne();
            socket.Disconnect();
        }
    }
}
