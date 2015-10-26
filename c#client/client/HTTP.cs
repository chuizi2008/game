using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;
using System.IO;
using System.Security.Cryptography;

namespace client
{
    public class HTTP
    {
        string httpServerIP = "http://192.168.1.232";
        MD5 md5 = new MD5CryptoServiceProvider();

        public int Login(string account, string password, string serverID, ref string strRet)
        {
            try
            {
                int ret = 0;
                byte[] result = Encoding.UTF8.GetBytes(password);    //tbPass为输入密码的文本框 
                MD5 md5 = new MD5CryptoServiceProvider();
                byte[] output = md5.ComputeHash(result);
                password = BitConverter.ToString(output).Replace("-", "");
                HttpWebRequest httpRequest = WebRequest.Create(httpServerIP + ":8080/Login?acc=" + account + "&pass=" + password + "&serverID=" + serverID) as HttpWebRequest;
                httpRequest.Timeout = 2000;
                httpRequest.Method = "GET";
                HttpWebResponse httpResponse = (HttpWebResponse)httpRequest.GetResponse();
                if ((int)httpResponse.StatusCode == 200)
                {
                    StreamReader sr = new StreamReader(httpResponse.GetResponseStream(), System.Text.Encoding.GetEncoding("UTF-8"));
                    ret = int.Parse(sr.ReadLine());
                    strRet = sr.ReadLine();
                    sr.Close();
                }
                httpResponse.Close();
                httpRequest.Abort();

                return ret;
            }
            catch (Exception err)
            {
                Console.WriteLine(err.Message);
                return 0;
            }
        }

        public int CreateAccount(string account, string password)
        {
            try
            {
                HttpWebRequest httpRequest = WebRequest.Create("http://192.168.1.191:8080/Create?acc=" + account + "&pass=" + password) as HttpWebRequest;
                httpRequest.Timeout = 2000;
                httpRequest.Method = "GET";
                HttpWebResponse httpResponse = (HttpWebResponse)httpRequest.GetResponse();
                int status = (int)httpResponse.StatusCode;
                return status;
            }
            catch (Exception err)
            {
                Console.WriteLine(err.Message);
                return 0;
            }
        }

        public int CreateRole(string account, string password, string occ)
        {
            try
            {
                HttpWebRequest httpRequest = WebRequest.Create(string.Format("http://192.168.1.191:8080/CreateRole?acc={0}&pass={1}&occ={2}", account, password, occ)) as HttpWebRequest;
                httpRequest.Timeout = 2000;
                httpRequest.Method = "GET";
                HttpWebResponse httpResponse = (HttpWebResponse)httpRequest.GetResponse();
                int status = (int)httpResponse.StatusCode;
                return status;
            }
            catch (Exception err)
            {
                Console.WriteLine(err.Message);
                return 0;
            }
        }

        /* POST请求版本
        public string Login(string account, string password)
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
        }*/

        public void UpFile()
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

        public void GetFile()
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
    }
}
