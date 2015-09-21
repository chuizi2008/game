using UnityEngine;
using System.Collections;
using System.Collections.Generic;

#if UNITY_EDITOR
using DEBUG = UnityEngine.Debug;
#else
using DEBUG = DebugConsole;
#endif

public class UIPageManager : MonoBehaviour {
     
	public static UIPageManager instance = null;

	public Hashtable pageTable = new Hashtable();

	private UIMainPage uimainPage = null;
	
	public UIMainPage MainPage
	{
		get
		{
			if (uimainPage == null)
				Debug.Log("uimainPage == null");

			return uimainPage;
		} 
		set
		{
			uimainPage = value;
		}
	}

	public GameObject AddPage(string name)
	{
		GameObject obj = Resources.Load (name) as GameObject;
		obj = GameObject.Instantiate(obj); 
		obj.SetActive (false);
		UIPageManager.Instance.pageTable.Add (name, obj);

		return obj;
	}

	public GameObject GetPage(string name)
	{
		return pageTable [name] as GameObject;
	}

    public static UIPageManager Instance
    {
        get
        {
            if (instance == null)
            {
                instance = GameManager.Instance.gameObject.AddComponent<UIPageManager>() as UIPageManager; 
            }
            return instance;
        }
    }
}
