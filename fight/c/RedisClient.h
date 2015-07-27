#pragma once

#include <stdio.h>
#include <winsock2.h>

/*
REDIS ͨ��Э�����İ� http://redis.readthedocs.org/en/latest/topic/protocol.html
*/

#pragma comment(lib,"ws2_32.lib")

// ��ǰ�ٸ��̳߳�~~~~~~~~~~~~~~~~~~~
// �����̳߳ؾ�������..........................
// ����Ҫ�ڴ�أ���Ϊ�����ǵ��߳���ѭ��SBģʽ��������

#define INFO_LENGHT 1024

class RedisClient
{
private:
	SOCKET Client_Sock;
	char szIP[30];
	int port;
	char szInfo[INFO_LENGHT];

private:
	int Read()
	{
		fd_set readfds;
		timeval timeout;

		timeout.tv_sec=3;
		timeout.tv_usec=0;

			FD_ZERO( &readfds );
			FD_SET( Client_Sock, &readfds );
			int ret = select( FD_SETSIZE,&readfds,NULL,NULL,&timeout );

			if( ret > 0 && FD_ISSET( Client_Sock, &readfds ) )
				return recv( Client_Sock, szInfo, INFO_LENGHT, 0 );

		return 0;
	}

public:
	RedisClient(void) { Client_Sock = 0; }

	~RedisClient(void) {}

	bool ReConnect()
	{
		closesocket(Client_Sock);

		Client_Sock = socket(AF_INET, SOCK_STREAM, 0);

		SOCKADDR_IN addrSrv;
		addrSrv.sin_addr.S_un.S_addr=inet_addr(szIP);
		addrSrv.sin_family=AF_INET;
		addrSrv.sin_port=htons(port);
		int ret = connect(Client_Sock, (SOCKADDR*)&addrSrv, sizeof(SOCKADDR));

		if (ret != 0)
			return false;

		return true;
	}

	bool Send(const char* msg, int len)
	{
		if (Client_Sock == 0 || msg == NULL || len < 5)
			return false;

		int ret = send(Client_Sock, msg, len, 0);
		if (ret != len)
			return false;

		return true;
	}

	bool Read_Set()
	{
		int size = Read();
		if (size <= 0)
			return false;

		return szInfo[0] == ':' && size == 4;
	}

	char* Read_Get()
	{
		int size = Read();
		if (size <= 0 && size > 1000)
			return NULL;

		// У��ͷ
		if (szInfo[0] != '$')
			return NULL;

		int beginIndex = 0;

		// ����ͷ
		for (beginIndex; beginIndex < size; beginIndex++)
		{
			if (szInfo[beginIndex] == 10)
			{
				beginIndex++;
				break;
			}
		}

		// ��ʼ��ȡʵ������
		for (int n = beginIndex; n < size; n++)
		{
			if (szInfo[n] == 13)
			{
				szInfo[n] = 0;
				return &szInfo[beginIndex];
			}
		}

		return NULL;
	}

	bool TheBegin(const char* szIP, int port)
	{
		if (szIP == NULL || port == 0)
			return false;

		WSADATA wsaData;

		int ret = 0;
		ret = WSAStartup(MAKEWORD(2,2), &wsaData);
		if (ret != 0)
			return false;

		Client_Sock = socket(AF_INET, SOCK_STREAM, 0);

		SOCKADDR_IN addrSrv;
		addrSrv.sin_addr.S_un.S_addr=inet_addr(szIP);
		addrSrv.sin_family=AF_INET;
		addrSrv.sin_port=htons(port);
		ret = connect(Client_Sock, (SOCKADDR*)&addrSrv, sizeof(SOCKADDR));

		u_long iMode = 1;  //non-blocking mode is enabled.

ioctlsocket(Client_Sock, FIONBIO, &iMode); //����Ϊ������ģʽ

		if (ret != 0)
			return false;

		return true;
	}

	void TheEnd()
	{
		closesocket(Client_Sock);

		WSACleanup();
	}
};

