using UnityEngine;
using System.Collections;

public class UIMainPage : MonoBehaviour {

    public GameObject UIRootObj;
    public Camera UICameraObj;

	void OnEnable()
	{ 
		UIPageManager.Instance.MainPage = this;
	}
	
	void OnDisable()
	{
		UIPageManager.Instance.MainPage = null;
	}

    /// <summary>
    /// 子页面必须是挂有uipanel脚本的对象
    /// </summary>
    /// <param name="pageObj"></param>
    public void AddChildPage(GameObject pageObj)
    {
        pageObj.SetActive(true);
        pageObj.transform.parent = UIRootObj.transform;
        pageObj.transform.localScale = new Vector3(1,1,1);
        pageObj.transform.localPosition = Vector3.zero;
        pageObj.transform.localRotation = Quaternion.identity;
    } 
}
