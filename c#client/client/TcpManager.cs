using System;
using System.Collections;
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
        public byte[] data = null;         // 字节流数据
    }

    public class TcpHandle
    {
        public enum EConnectState
        {
            ConnectState_None,
            ConnectState_TryConnect,			//初始化网络连接
            ConnectState_StartConnect,			//开始连接服务器
            ConnectState_WaitConnect,			//等待连接成功
            ConnectState_WaitKey,				//连接成功后等待服务器发送Key值
            ConnectState_GameStart,				//开始游戏
            ConnectState_ReadError,				//读取数据错误
            ConnectState_WriteError,			//写入数据错误
            ConnectState_Disconnect				//网络断开
        };

        public delegate void MsgCallBack(TcpHandle tcp, MsgPacket msg);

        private string m_strIP = "";
        private int m_nPort = 0;
        private TcpClient m_TcpClient = null;
        private Thread thread = null;
        private Stack<MsgPacket> m_Stack = new Stack<MsgPacket>();
        private Hashtable msgTable = new Hashtable();

        public TcpHandle(string ip, int port)
        {
            m_strIP = ip;
            m_nPort = port;

            m_TcpClient = new TcpClient(m_strIP, m_nPort);

            // 开启线程，用于监听数据接收
            thread = new Thread(new ParameterizedThreadStart(Thread_Read));
            thread.Start(this);
        }

        public void RegisterHandler(UInt16 nMsgId, MsgCallBack pCallBack)
        {
            msgTable[nMsgId] = pCallBack;
        }

        public EConnectState CheckState()
        {
            if (!m_TcpClient.Connected)
                return EConnectState.ConnectState_Disconnect;

            return EConnectState.ConnectState_GameStart;
        }

        // 判断当前栈中是否有新消息，有消息就进行处理
        public void TickServerMsgTransfer()
        {
            MsgPacket msg = null;
            while (null != (msg = GetRecvMsgPacker()))
            {
                if (msg.msgIndex == 0 || msg.msgLength == 0)
                    continue;

                if (!msgTable.ContainsKey(msg.msgIndex))
                    continue;

                (msgTable[msg.msgIndex] as MsgCallBack)(this, msg);
            }
        }

        // 关闭
        public void Close()
        {
            m_TcpClient.Close();
        }

        // 循环读取指定大小的数据
        private void Read(ref NetworkStream stream, byte[] data)
        {
            int readLength = 0;
            while (readLength < data.Length)
            {
                int ret = stream.Read(data, readLength, data.Length - readLength);
                if (ret == 0)
                    throw new Exception("Unexpected disconnect");

                readLength += ret;
            }
        }

        private void Thread_Read(object main)
        {
            byte[] data1 = new byte[2];
            byte[] data2 = new byte[2];

            TcpHandle tcp = main as TcpHandle;

            try
            {
                while (tcp.m_TcpClient.Connected)
                {
                    MsgPacket msg = new MsgPacket();
                    NetworkStream stream = m_TcpClient.GetStream();
                    Read(ref stream, data1);
                    msg.msgLength = BitConverter.ToUInt16(data1, 0);
                    Read(ref stream, data2);
                    msg.msgIndex = BitConverter.ToUInt16(data2, 0);

                    if (msg.msgLength != 0)
                    {
                        msg.data = new byte[msg.msgLength];
                        Read(ref stream, msg.data);
                    }

                    lock (tcp.m_Stack)
                        tcp.m_Stack.Push(msg);
                }
             }
            catch (Exception err)
            {
            }
            finally
            {
                tcp.m_TcpClient.Close();
                lock (tcp.m_Stack)
                    tcp.m_Stack.Clear();
            }
        }

        private MsgPacket GetRecvMsgPacker()
        {
            lock (m_Stack)
            {
                if (m_Stack.Count == 0)
                    return null;

                return m_Stack.Pop();
            }
        }

        public bool Send(WriteMsg msg)
        {
            if (msg == null)
                return false;

            int ret = m_TcpClient.Client.Send(msg.GetByte());
            return ret > 0;
        }
    };

    public class WriteMsg
    {
        protected UInt32 PacketSize = 2046; // 当总包大小>=2046时，就可以发送了,如果为0，就有消息及发送
        protected MemoryStream stream = null;
        protected BinaryWriter writeStream = null;

        public WriteMsg(UInt16 id)
        {
            stream = new MemoryStream();
            writeStream = new BinaryWriter(stream, Encoding.UTF8);
            WriteUInt16(0);
            WriteUInt16(id);
        }

        public void WriteInt(int data)
        {
            writeStream.Write(data);
        }

        public void WriteUInt16(UInt16 data)
        {
            writeStream.Write(data);
        }

        public void WriteUInt32(UInt32 data)
        {
            writeStream.Write(data);
        }

        public void WriteString(string data)
        {
            byte[] byteData = System.Text.Encoding.UTF8.GetBytes(data);
            writeStream.Write((UInt16)byteData.Length);
            writeStream.Write(byteData);
        }

        public void WriteNByte(byte[] data)
        {
            writeStream.Write(data);
        }

        public byte[] GetByte()
        {
            stream.Seek(0, SeekOrigin.Begin);
            WriteUInt16((UInt16)stream.Length);
            stream.Seek(0, SeekOrigin.Begin);
            byte[] data = new byte[stream.Length];
            stream.Read(data, 0, (int)stream.Length);
            return data;
        }
    };

    public class ReadMsg
    {
        protected byte[] m_Data = null;
        protected int m_Position = 0;
        protected int m_Length = 0;

        public ReadMsg(byte[] data)
        {
            m_Data = data;
            m_Length = data.Length;
        }

        public byte ReadByte()
        {
            byte ret = m_Data[m_Position];
            m_Position += 1;
            return ret;
        }

        public UInt16 ReadUInt16()
        {
            UInt16 ret = BitConverter.ToUInt16(m_Data, m_Position);
            m_Position += 2;
            return ret;
        }

        public UInt32 ReadUInt32()
        {
            UInt32 ret = BitConverter.ToUInt32(m_Data, m_Position);
            m_Position += 4;
            return ret;
        }

        public UInt64 ReadUInt64()
        {
            UInt64 ret = BitConverter.ToUInt64(m_Data, m_Position);
            m_Position += 8;
            return ret;
        }

        public Int16 ReadInt16()
        {
            Int16 ret = BitConverter.ToInt16(m_Data, m_Position);
            m_Position += 2;
            return ret;
        }

        public Int32 ReadInt32()
        {
            Int32 ret = BitConverter.ToInt32(m_Data, m_Position);
            m_Position += 4;
            return ret;
        }

        public Int64 ReadInt64()
        {
            Int64 ret = BitConverter.ToInt64(m_Data, m_Position);
            m_Position += 8;
            return ret;
        }

        public string ReadString(int strLen)
        {
            string ret = System.Text.Encoding.UTF8.GetString(m_Data, m_Position, strLen);
            m_Position += strLen;
            return ret;
        }
    }
}
