using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class Launch : MonoBehaviour {

	// Use this for initialization
    void Awake()
    {
        DontDestroyOnLoad(this); 


#if UNITY_IPHONE
        UnityEngine.iOS.Device.SetNoBackupFlag("需要的是一个地址");
        UnityEngine.iOS.Device.ResetNoBackupFlag("");
#endif

		UIPageManager.Instance.AddPage ("WebView").SetActive (true);
		UIPageManager.Instance.AddPage ("GPS");
		UIPageManager.Instance.AddPage ("MessageBox");
		UIPageManager.Instance.AddPage ("WaitNet");
		UIPageManager.Instance.AddPage ("Login");
    }
}
