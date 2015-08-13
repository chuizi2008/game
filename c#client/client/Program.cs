using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Timers;
using System.Net.Sockets;
using System.Runtime.InteropServices;

namespace client
{
    class chuizi
    {
        private int ret = 0;

        public bool IsOver()
        {
            lock (this)
            {
                return ret == 99;
            }
        }

        public void Add()
        {
            lock (this)
            {
                ret++;
            }
        }
    }

    class Program
    {
        [DllImport("kernel32")]
        static extern uint GetTickCount();

        public static void UpFile()
        {
            string boundary = "asd";
            string strBodyData = "";
            strBodyData += "--" + boundary + "\r\n";
            strBodyData += "Content-Disposition: form-data; name=\"title\"\r\n";
            strBodyData += "\r\n";
            strBodyData += "hahagechuizi\r\n";

            strBodyData += "--" + boundary + "\r\n";
            strBodyData += "Content-Disposition: form-data; name=\"upload\"; filename=\"vboxapi.txt\"\r\n";
            strBodyData += "Content-Type: application/octet-stream\r\n";
            strBodyData += "\r\n";
            strBodyData += "chuizichuizichuizichuizi";
            strBodyData += "\r\n";
            strBodyData += "--" + boundary + "--" + "\r\n";

            byte[] bodydata = System.Text.ASCIIEncoding.ASCII.GetBytes(strBodyData);

            // Prepare web request...
            HttpWebRequest myRequest = (HttpWebRequest)WebRequest.Create("http://192.168.1.191:8080/UpFile");

            myRequest.Method = "POST";
            myRequest.ContentType = "multipart/form-data; boundary=" + boundary;
            myRequest.ContentLength = bodydata.Length;
            Stream newStream = myRequest.GetRequestStream();

            // Send the data.
            newStream.Write(bodydata, 0, bodydata.Length);
            newStream.Close();

            // Get response
            HttpWebResponse response = (HttpWebResponse)myRequest.GetResponse();
            StreamReader reader = new StreamReader(response.GetResponseStream(), Encoding.Default);
            string content = reader.ReadToEnd();
            Console.WriteLine(content);
        }

        public static void GetFile()
        {
            HttpWebRequest request = (HttpWebRequest)System.Net.HttpWebRequest.Create("http://192.168.1.191:8080/GetFile=hahagechuizi");
            HttpWebResponse response = (System.Net.HttpWebResponse)request.GetResponse();

            long totalBytes = response.ContentLength;

            Stream read_File = response.GetResponseStream();
            File.Delete("temp");
            Stream write_File = new FileStream("temp", System.IO.FileMode.Create);
            byte[] by = new byte[1024];
            int osize = read_File.Read(by, 0, (int)by.Length);
            while (osize > 0)
            {
                write_File.Write(by, 0, osize);
                osize = read_File.Read(by, 0, (int)by.Length);
            }
            read_File.Close();
            write_File.Close();
        }

        public static string Login(string account, string password)
        {
            byte[] result = Encoding.UTF8.GetBytes(password);    //tbPass为输入密码的文本框 
            MD5 md5 = new MD5CryptoServiceProvider();
            byte[] output = md5.ComputeHash(result);
            password = BitConverter.ToString(output).Replace("-", "");


            string boundary = "asd";
            string strBodyData = "";
            strBodyData += "--" + boundary + "\r\n";
            strBodyData += "Content-Disposition: form-data; name=\"Account\"\r\n";
            strBodyData += "\r\n";
            strBodyData += account + "\r\n";

            strBodyData += "--" + boundary + "\r\n";
            strBodyData += "Content-Disposition: form-data; name=\"Password\"\r\n";
            strBodyData += "\r\n";
            strBodyData += password;
            strBodyData += "\r\n";
            strBodyData += "--" + boundary + "--" + "\r\n";

            byte[] bodydata = System.Text.ASCIIEncoding.UTF8.GetBytes(strBodyData);

            // Prepare web request...
            HttpWebRequest myRequest = (HttpWebRequest)WebRequest.Create("http://192.168.1.191:8080/Login");

            myRequest.Method = "POST";
            myRequest.ContentType = "multipart/form-data; boundary=" + boundary;
            myRequest.ContentLength = bodydata.Length;
            Stream newStream = myRequest.GetRequestStream();

            // Send the data.
            newStream.Write(bodydata, 0, bodydata.Length);
            newStream.Close();

            // Get response
            HttpWebResponse response = (HttpWebResponse)myRequest.GetResponse();
            StreamReader reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8);
            string content = reader.ReadToEnd();

            int index = content.IndexOf(":");
            if (index > account.Length)
                return null;

            return content.Substring(index + 1, content.IndexOf("<") - 1 - index);
        }

        static void LoginRet(TcpHandle tcp, MsgPacket msg)
        {
            tcp.Close();
            return;
        }

        static void Run(Object obj)
        {
            string loginKey = Login("1", "1");
            if (loginKey == null)
                return;

            TcpHandle tcp = new TcpHandle("192.168.1.191", 8888);

            tcp.RegisterHandler(1111, LoginRet);

            WriteMsg msg = new WriteMsg(1111);
            msg.WriteString("1");
            msg.WriteString(loginKey);
            tcp.Send(msg);

            while (tcp.CheckState() == TcpHandle.EConnectState.ConnectState_GameStart)
            {
                tcp.TickServerMsgTransfer();
            }

            tcp.Close();

            /*
            chuizi o = null;
            if (obj != null)
                o = obj as chuizi;

            string loginKey = Login("1", "1");
            if (loginKey == null)
                return;

            TcpHandle tcp = new TcpHandle("192.168.1.191", 8888);
            string info = "{\"Account\": \"1\", \"LoginKey\": \"" + loginKey + "\"}";
            tcp.Send(1, info);
            while (true)
            {
                MsgPacket msgPack = tcp.GetMshPacker();
                if (msgPack != null && msgPack.msgIndex == 1111)
                    break;
            }
            tcp.Close();

            if (o != null)
                o.Add();*/
        }

        static void Main(string[] args)
        {
            uint ret = GetTickCount();
            Run(null);
            Console.WriteLine(GetTickCount() - ret);
            Console.ReadKey(true);
            /*
            uint ret = GetTickCount();
            chuizi asd = new chuizi();
            for (int n = 0; n < 99; n++)
            {
                Thread run = new Thread(new ParameterizedThreadStart(Run));
                run.Start(asd);
            }

            while (!asd.IsOver())
                Thread.Sleep(1);
            
            Console.WriteLine(GetTickCount() - ret);
            Console.ReadKey(true);*/
        }
    }
}
