using UnityEngine;
using System.Collections;

public class UI_LoginPanel : MonoBehaviour {

	public UILabel labelAccount;
	public UILabel labelPassword;

    public void OnLogin()
    {
		GameObject panel = UIPageManager.Instance.GetPage ("MessageBox");
		UI_MessageBox msgPanel = panel.GetComponents<UI_MessageBox> ()[0];
		if (labelAccount.text.Length == 0) {
			Debug.Log ("3123");
			msgPanel.info.text = "帐号不能为空";
			panel.SetActive(true);
		}

		Debug.Log ("123");
    } 
}
