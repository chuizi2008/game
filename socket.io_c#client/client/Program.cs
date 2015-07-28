using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using System.IO;
using System.Net;
using Quobject.SocketIoClientDotNet.Client;
using Newtonsoft.Json.Linq;

namespace client
{
    class Program
    {
        public static ManualResetEvent mre = new ManualResetEvent(false);

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

        static void Main(string[] args)
        {
            UpFile();
            GetFile();
            Console.ReadKey();

            return;
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
