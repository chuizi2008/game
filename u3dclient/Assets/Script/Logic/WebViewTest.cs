using UnityEngine;
using System.Collections;

public class WebViewTest : MonoBehaviour {
	
	// Update is called once per frame
	void Update ()
	{
		//当用户按下手机的返回键或home键退出游戏
		if (Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.Home) )
		{
			Application.Quit();
		}
	}
	
	void OnGUI()
	{
		if(GUILayout.Button("OPEN WEBVIEW",GUILayout.Height(100)))
		{
			//注释1
			AndroidJavaClass jc = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
			AndroidJavaObject jo = jc.GetStatic<AndroidJavaObject>("currentActivity");
			jo.Call("StartWebView","");
		}
		
	}
}