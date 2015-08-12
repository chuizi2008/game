using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net.Sockets;
using System.IO;
using System.Threading;

namespace client
{
     public class MsgPacket
    {
        public UInt16 msgIndex = 0;        // 消息定义
        public UInt16 msgLength = 0;       // 消息长度
        public string jsonData = "";       // JSON消息数据
    }

    public class TcpHandle : MsgPack
    {
        private string m_strIP = "";
        private int m_nPort = 0;
        private TcpClient m_TcpClient = null;
        private Thread thread = null;
        private Stack<MsgPacket> m_Stack = new Stack<MsgPacket>();

        public TcpHandle(string ip, int port)
            : base(0)
        {
            m_strIP = ip;
            m_nPort = port;

            m_TcpClient = new TcpClient(m_strIP, m_nPort);

            thread = new Thread(new ParameterizedThreadStart(ReadMsgPacker));
            thread.Start(this);
        }

        private void ReadThread()
        {
        }

        private byte[] ReadData(int len)
        {
            if (!m_TcpClient.Connected)
                throw new Exception("Unexpected disconnect");

            NetworkStream stream = m_TcpClient.GetStream();
            byte[] data = new byte[len];
            int readLength = 0;
            while (readLength < len)
            {
                int ret = stream.Read(data, readLength, data.Length - readLength);
                if (ret == 0)
                    throw new Exception("Unexpected disconnect");

                readLength += ret;
            }

            return data;
        }

        private UInt16 ReadUInt16()
        {
            return BitConverter.ToUInt16(ReadData(2), 0);
        }

        private string ReadString(int len)
        {
            NetworkStream stream = m_TcpClient.GetStream();
            byte[] data = new byte[len];
            int readLength = 0;
            while (readLength < len)
            {
                int ret = stream.Read(data, readLength, data.Length - readLength);
                if (ret == 0)
                    throw new Exception("Unexpected disconnect");

                readLength += ret;
            }

            return System.Text.Encoding.UTF8.GetString(data);
        }

        private void ReadMsgPacker(object main)
        {
            TcpHandle tcp = main as TcpHandle;
            while (tcp.m_TcpClient.Connected)
            {
                try
                {
                    MsgPacket pack = new MsgPacket();
                    pack.msgLength = tcp.ReadUInt16();
                    pack.msgIndex = tcp.ReadUInt16();
                    pack.jsonData = tcp.ReadString(pack.msgLength);
                    lock (m_Stack)
                        m_Stack.Push(pack);
                }
                catch (Exception err)
                {
                    return;
                }
            }
        }

        public void Close()
        {
            m_TcpClient.Close();
        }

        public MsgPacket GetMshPacker()
        {
            MsgPacket pack = null;
            lock (m_Stack)
            {
                if (m_Stack.Count > 0)
                    pack = m_Stack.Pop();
            }

            return pack;
        }

        public bool Send(UInt16 msgID, string json)
        {
            byte[] data = System.Text.Encoding.UTF8.GetBytes(json);
            Push((UInt16)data.Length);
            Push((UInt16)msgID);
            Push(data);

            return Send();
        }

        public bool Send()
        {
            int ret = m_TcpClient.Client.Send(base.GetByte());
            return ret > 0;
        }
    };

    public class MsgPack
    {
        private UInt32 PacketSize = 2046; // 当总包大小>=2046时，就可以发送了,如果为0，就有消息及发送

        private MemoryStream stream = null;
        private BinaryWriter writeStream = null;

        public MsgPack(UInt32 size)
        {
            PacketSize = size;
            stream = new MemoryStream();
            writeStream = new BinaryWriter(stream, Encoding.UTF8);
        }

        public void Push(int data)
        {
            writeStream.Write(data);
        }

        public void Push(UInt16 data)
        {
            writeStream.Write(data);
        }

        public void Push(UInt32 data)
        {
            writeStream.Write(data);
        }

        public void Push(string data)
        {
            writeStream.Write(data);
        }

        public void Push(byte[] data)
        {
            writeStream.Write(data);
        }

        public byte[] GetByte()
        {
            // 移动到头部
            writeStream.Seek(0, SeekOrigin.Begin);

            // 这里应该设置一个弹性自动的内存空间，而不是这样固定的，每次都NEW
            byte[] data = new byte[stream.Length];
            stream.Read(data, 0, (int)stream.Length);
            stream.Position = 0;
            stream.SetLength(0);
            return data;
        }
    };
}
