using UnityEngine;
using System.Collections;
using System.Collections.Generic;

#if UNITY_EDITOR
using DEBUG = UnityEngine.Debug;
#else
using DEBUG = DebugConsole;
#endif


public class GameManager : MonoBehaviour
{
	public GameState gameState = new GameState();
	static bool isDestroy = false;
	static GameManager instance;

	public static GameManager Instance
	{
		get
		{
			if (instance == null && !isDestroy)
			{
				GameObject gameObj = new GameObject("_GameManager");
				DontDestroyOnLoad(gameObj);
				instance = gameObj.AddComponent<GameManager>() as GameManager;
			}
			return instance;
		}
	}
	
	public static bool IsDestroy
	{
		get
		{
			return isDestroy;
		}
	}
	
	void OnDestroy()
	{
		isDestroy = true;
		instance = null;
	}
	// Use this for initialization  
	
	IEnumerator Init()
	{
		yield return null;
	}  
	
	public void Enter()
	{
	}
}
