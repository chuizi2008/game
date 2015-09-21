  
using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
 
/// <summary>
/// 调试对话框，可输出调试信息，也可输入命令行参数
/// </summary>
public class DebugConsole : MonoBehaviour
{
    readonly Version VERSION = new Version("3.0");
    readonly string ENTRYFIELD = "DebugConsoleEntryField";

    /// <summary>
    /// </summary>
    /// <param name="args">The text typed in the console after the name of the command.</param>
    public delegate object DebugCommand(params string[] args);

    /// <summary>
    /// How many lines of text this console will display.
    /// </summary>
    public int maxLinesForDisplay = 200;

    /// <summary>
    /// Default color of the standard display text.
    /// </summary>
    public Color defaultColor = Message.defaultColor;
    public Color warningColor = Message.warningColor;
    public Color errorColor = Message.errorColor;
    public Color systemColor = Message.systemColor;
    public Color inputColor = Message.inputColor;
    public Color outputColor = Message.outputColor;

    public bool IsDebug = true;

    /// <summary>
    /// Used to check (or toggle) the open state of the console.
    /// </summary>
    public static bool IsOpen
    {
        get { return DebugConsole.Instance._isOpen; }
        set { DebugConsole.Instance._isOpen = value; }
    }

    /// <summary>
    /// Static instance of the console.
    ///
    /// When you want to access the console without a direct
    /// reference (which you do in mose cases), use DebugConsole.Instance and the required
    /// GameObject initialization will be done for you.
    /// </summary>
    public static DebugConsole Instance
    {
        get
        {
            if (_instance == null)
            {
                _instance = FindObjectOfType(typeof(DebugConsole)) as DebugConsole;

                if (_instance != null)
                    return _instance;

                //GameObject console = new GameObject("__Debug Console__");
                //_instance = console.AddComponent<DebugConsole>();
            }

            return _instance;
        }
    }

    /// <summary>
    /// Key to press to toggle the visibility of the console.
    /// </summary>
    public static KeyCode toggleKey = KeyCode.BackQuote;

    static DebugConsole _instance;
    Dictionary<string, DebugCommand> _cmdTable = new Dictionary<string, DebugCommand>();
    Dictionary<string, string> _cmdTableDiscribes = new Dictionary<string, string>(); //cmd的注释
    Dictionary<string, WatchVarBase> _watchVarTable = new Dictionary<string, WatchVarBase>();
    string _inputString = string.Empty;

    public Rect _windowRect;


    Vector2 _logScrollPos = Vector2.zero;
    Vector2 _rawLogScrollPos = Vector2.zero;
    Vector2 _watchVarsScrollPos = Vector2.zero;
    public bool _isOpen;

    StringBuilder _displayString = new StringBuilder();

    FPSCounter fps;

    bool dirty;
    #region GUI position values
    // Make these values public if you want to adjust layout of console window
    Rect scrollRect = new Rect(10, 20, 580, 362);
    Rect inputRect = new Rect(10, 388, 580, 24);
    Rect toolbarRect = new Rect(16, 428, 425, 35);
    Rect enterButtonRect = new Rect(465, 428, 100, 35);
    Rect messageLine = new Rect(4, 0, 564, 20);

    int lineOffset = -4;
    string[] tabs = new string[] { "Log", "Copy Log", "Watch Vars" };

    // Keep these private, their values are generated automatically
    Rect nameRect;
    Rect valueRect;
    Rect innerRect = new Rect(0, 0, 0, 0);
    int innerHeight = 0;
    int toolbarIndex = 0;
    GUIContent guiContent = new GUIContent();
    GUI.WindowFunction[] windowMethods;
    GUIStyle labelStyle;
    #endregion

    /// <summary>
    /// This Enum holds the message types used to easily control the formatting and display of a message.
    /// </summary>
    public enum MessageType
    {
        NORMAL,
        WARNING,
        ERROR,
        SYSTEM,
        INPUT,
        OUTPUT
    }

    /// <summary>
    /// Represents a single message, with formatting options.
    /// </summary>
    struct Message
    {
        string text;
        string formatted;
        public int sameMsgCount;       //同一个Msg多次重复出现次数
        public void MsgCountAdd() { sameMsgCount++;  }
        MessageType type;
        public Color color { get; private set; }

        public static Color defaultColor = Color.white;
        public static Color warningColor = Color.yellow;
        public static Color errorColor = Color.red;
        public static Color systemColor = Color.green;
        public static Color inputColor = Color.green;
        public static Color outputColor = Color.cyan;

        public Message(object messageObject)
            : this(messageObject, MessageType.NORMAL, Message.defaultColor)
        {
        }

        public Message(object messageObject, Color displayColor)
            : this(messageObject, MessageType.NORMAL, displayColor)
        {
        }

        public Message(object messageObject, MessageType messageType)
            : this(messageObject, messageType, Message.defaultColor)
        {
            switch (messageType)
            {
                case MessageType.ERROR:
                    color = errorColor;
                    break;
                case MessageType.SYSTEM:
                    color = systemColor;
                    break;
                case MessageType.WARNING:
                    color = warningColor;
                    break;
                case MessageType.OUTPUT:
                    color = outputColor;
                    break;
                case MessageType.INPUT:
                    color = inputColor;
                    break;
            }
        }

        public Message(object messageObject, MessageType messageType, Color displayColor)
            : this()
        {
            if (messageObject == null)
                this.text = "<null>";
            else
                this.text = messageObject.ToString();

            this.formatted = string.Empty;
            this.type = messageType;
            this.color = displayColor;


        }

        public static Message Log(object message)
        {
            return new Message(message, MessageType.NORMAL, defaultColor);
        }

        public static Message System(object message)
        {
            return new Message(message, MessageType.SYSTEM, systemColor);
        }

        public static Message Warning(object message)
        {
            return new Message(message, MessageType.WARNING, warningColor);
        }

        public static Message Error(object message)
        {
            return new Message(message, MessageType.ERROR, errorColor);
        }

        public static Message Output(object message)
        {
            return new Message(message, MessageType.OUTPUT, outputColor);
        }

        public static Message Input(object message)
        {
            return new Message(message, MessageType.INPUT, inputColor);
        }

        public override string ToString()
        {
            switch (type)
            {
                case MessageType.ERROR:
                    return string.Format("[{0}] {1}", type, text);
                case MessageType.WARNING:
                    return string.Format("[{0}] {1}", type, text);
                default:
                    return ToGUIString();
            }
        }

        public string ToGUIString()
        {
            if (!string.IsNullOrEmpty(formatted))
                return formatted;

            switch (type)
            {
                case MessageType.INPUT:
                    formatted = ">>> " + text;
                    break;
                case MessageType.OUTPUT:
                    var lines = text.Trim('\n').Split('\n');
                    var output = new StringBuilder();

                    foreach (var line in lines)
                    {
                        output.AppendLine("= " + line);
                    }

                    formatted = output.ToString();
                    break;
                case MessageType.SYSTEM:
                    formatted = "# " + text;
                    break;
                case MessageType.WARNING:
                    formatted = "* " + text;
                    break;
                case MessageType.ERROR:
                    formatted = "** " + text;
                    break;
                default:
                    formatted = text;
                    break;
            }

            return formatted;
        }
    }

    class History
    {
        List<string> history = new List<string>();
        int index = 0;

        public void Add(string item)
        {
            history.Add(item);
            index = 0;
        }

        string current;

        public string Fetch(string current, bool next)
        {
            if (index == 0) this.current = current;

            if (history.Count == 0) return current;

            index += next ? -1 : 1;

            if (history.Count + index < 0 || history.Count + index > history.Count - 1)
            {
                index = 0;
                return this.current;
            }

            var result = history[history.Count + index];

            return result;
        }
    }

    List<Message> _messages = new List<Message>();
    History _history = new History();

    void Awake()
    {
        if (_instance != null && _instance != this)
        {
            DestroyImmediate(this, true);
            return;
        }

        _instance = this;
    }
    public void InitPosition()
    {
        _windowRect = new Rect(Screen.width / 2 - 300, 30, 600, 470);
    }
    void OnEnable()
    {
        windowMethods = new GUI.WindowFunction[] { LogWindow, CopyLogWindow, WatchVarWindow };

        fps = new FPSCounter();
        StartCoroutine(fps.Update());

        nameRect = messageLine;
        valueRect = messageLine;

        Message.defaultColor = defaultColor;
        Message.warningColor = warningColor;
        Message.errorColor = errorColor;
        Message.systemColor = systemColor;
        Message.inputColor = inputColor;
        Message.outputColor = outputColor;

        _windowRect = new Rect(Screen.width / 2 - 300, 30, 600, 470);


        LogMessage(Message.System("输入 '/?' 显示帮助"));
        LogMessage(Message.Log(""));

        this.RegisterCommandCallback("close", CMDClose, "关闭调试窗口");
        this.RegisterCommandCallback("clear", CMDClear, "清除调试信息");
        this.RegisterCommandCallback("sys", CMDSystemInfo, "显示系统信息");
        this.RegisterCommandCallback("/?", CMDHelp, "显示可用命令");
    }

    void OnGUI()
    {
        while (_messages.Count > maxLinesForDisplay)
        {
            _messages.RemoveAt(0);
        }


        // Toggle key shows the console in non-iOS dev builds
        if (Event.current.keyCode == toggleKey && Event.current.type == EventType.KeyUp)
        {
            _windowRect.x = 10;
            _windowRect.y = 10;
            _isOpen = !_isOpen;
        }
         
        if (Input.touchCount == 3)
            _isOpen = !_isOpen;


        if (!_isOpen)
            return;

        labelStyle = GUI.skin.label;

        innerRect.width = messageLine.width;

    _windowRect = GUI.Window(-1111, _windowRect, windowMethods[toolbarIndex], string.Format("Debug Console v{0}\tfps: {1:00.0}", VERSION, fps.current));
    GUI.BringWindowToFront(-1111);


        if (GUI.GetNameOfFocusedControl() == ENTRYFIELD)
        {
            var evt = Event.current;

            if (evt.isKey && evt.type == EventType.KeyUp)
            {
                if (evt.keyCode == KeyCode.Return)
                {
                    EvalInputString(_inputString);
                    _inputString = string.Empty;
                }
                else if (evt.keyCode == KeyCode.UpArrow)
                {
                    _inputString = _history.Fetch(_inputString, true);
                }
                else if (evt.keyCode == KeyCode.DownArrow)
                {
                    _inputString = _history.Fetch(_inputString, false);
                }
            }
        }
    }

    void OnDestroy()
    {
        StopAllCoroutines();
    }
    #region StaticAccessors

    /// <summary>
    /// Prints a message string to the console.
    /// </summary>
    /// <param name="message">Message to print.</param>
    public static object Log(object message)
    {
        if (DebugConsole.Instance==null||!DebugConsole.Instance.IsDebug)
            return null;

        DebugConsole.Instance.LogMessage(Message.Log(message));

        return message;
    }

    /// <summary>
    /// Prints a message string to the console.
    /// </summary>
    /// <param name="message">Message to print.</param>
    /// <param name="messageType">The MessageType of the message. Used to provide
    /// formatting in order to distinguish between message types.</param>
    public static object Log(object message, MessageType messageType)
    {
        if (DebugConsole.Instance==null||!DebugConsole.Instance.IsDebug)
            return null;
        DebugConsole.Instance.LogMessage(new Message(message, messageType));

        return message;
    }

    /// <summary>
    /// Prints a message string to the console.
    /// </summary>
    /// <param name="message">Message to print.</param>
    /// <param name="displayColor">The text color to use when displaying the message.</param>
    public static object Log(object message, Color displayColor)
    {
        if (DebugConsole.Instance==null||!DebugConsole.Instance.IsDebug)
            return null;
        DebugConsole.Instance.LogMessage(new Message(message, displayColor));

        return message;
    }

    /// <summary>
    /// Prints a message string to the console.
    /// </summary>
    /// <param name="message">Messate to print.</param>
    /// <param name="messageType">The MessageType of the message. Used to provide
    /// formatting in order to distinguish between message types.</param>
    /// <param name="displayColor">The color to use when displaying the message.</param>
    /// <param name="useCustomColor">Flag indicating if the displayColor value should be used or
    /// if the default color for the message type should be used instead.</param>
    public static object Log(object message, MessageType messageType, Color displayColor)
    {
        if (DebugConsole.Instance == null || !DebugConsole.Instance.IsDebug)
            return null;
        DebugConsole.Instance.LogMessage(new Message(message, messageType, displayColor));
#if UNITY_EDITOR
        UnityEngine.Debug.Log(message);
#endif
        return message;
    }

    /// <summary>
    /// Prints a message string to the console using the "Warning" message type formatting.
    /// </summary>
    /// <param name="message">Message to print.</param>
    public static object LogWarning(object message)
    {
        if (DebugConsole.Instance==null||!DebugConsole.Instance.IsDebug)
            return null;
        DebugConsole.Instance.LogMessage(Message.Warning(message));
#if UNITY_EDITOR
        UnityEngine.Debug.LogWarning(message);
#endif
        return message;
    }

    /// <summary>
    /// Prints a message string to the console using the "Error" message type formatting.
    /// </summary>
    /// <param name="message">Message to print.</param>
    public static object LogError(object message)
    {
        if (DebugConsole.Instance == null || !DebugConsole.Instance.IsDebug)
            return null;
        DebugConsole.Instance.LogMessage(Message.Error(message));
#if UNITY_EDITOR
        UnityEngine.Debug.LogError(message);
#endif
        return message;
    }

    /// <summary>
    /// Clears all console output.
    /// </summary>
    public static void Clear()
    {
        DebugConsole.Instance.ClearLog();
    }

    /// <summary>
    /// Registers a debug command that is "fired" when the specified command string is entered.
    /// </summary>
    /// <param name="commandString">The string that represents the command. For example: "FOV"</param>
    /// <param name="commandCallback">The method/function to call with the commandString is entered.
    /// For example: "SetFOV"</param>
    /// 
    public static void RegisterCommand(string commandString, DebugCommand commandCallback, string CMD_Discribes)
    {
        DebugConsole.Instance.RegisterCommandCallback(commandString, commandCallback, CMD_Discribes);
    }

    /// <summary>
    /// Removes a previously-registered debug command.
    /// </summary>
    /// <param name="commandString">The string that represents the command.</param>
    public static void UnRegisterCommand(string commandString)
    {
        DebugConsole.Instance.UnRegisterCommandCallback(commandString);
    }

    /// <summary>
    /// Registers a named "watch var" for monitoring.
    /// </summary>
    /// <param name="name">Name of the watch var to be shown in the console.</param>
    /// <param name="watchVar">The WatchVar instance you want to monitor.</param>
    public static void RegisterWatchVar(WatchVarBase watchVar)
    {
        DebugConsole.Instance.AddWatchVarToTable(watchVar);
    }

    /// <summary>
    /// Removes a previously-registered watch var.
    /// </summary>
    /// <param name="name">Name of the watch var you wish to remove.</param>
    public static void UnRegisterWatchVar(string name)
    {
        DebugConsole.Instance.RemoveWatchVarFromTable(name);
    }
    #endregion
    #region Console commands

    //==== Built-in example DebugCommand handlers ====
    object CMDClose(params string[] args)
    {
        _isOpen = false;

        return "closed";
    }

    object CMDClear(params string[] args)
    {
        this.ClearLog();

        return "clear";
    }

    object CMDHelp(params string[] args)
    {
        var output = new StringBuilder();

        output.AppendLine("可用命令列表: ");
        output.AppendLine("--------------------------");
        foreach (string key in _cmdTable.Keys)
        {
            output.AppendLine(_cmdTableDiscribes[key] + "  " + key);
        }

        output.Append("--------------------------");

        return output.ToString();
    }

    object CMDSystemInfo(params string[] args)
    {
        var info = new StringBuilder();

        info.AppendLine("Unity Ver: " + Application.unityVersion);
        info.AppendLine("Platform: " + Application.platform);
        info.AppendLine("Language: " + Application.systemLanguage);
        info.AppendLine(string.Format("Level: {0} [{1}]", Application.loadedLevelName, Application.loadedLevel));
        info.AppendLine("Data Path: " + Application.dataPath); 
        info.AppendLine("Persistent Path: " + Application.persistentDataPath);

        info.AppendLine("SystemMemorySize: " + SystemInfo.systemMemorySize);
        info.AppendLine("DeviceModel: " + SystemInfo.deviceModel);
        info.AppendLine("DeviceType: " + SystemInfo.deviceType);
        info.AppendLine("GraphicsDeviceName: " + SystemInfo.graphicsDeviceName);
        info.AppendLine("GraphicsMemorySize: " + SystemInfo.graphicsMemorySize);
        info.AppendLine("GraphicsPixelFillrate: " + SystemInfo.graphicsPixelFillrate);
        info.AppendLine("GraphicsShaderLevel: " + SystemInfo.graphicsShaderLevel);
        info.AppendLine("MaxTextureSize: " + SystemInfo.maxTextureSize);
        info.AppendLine("OperatingSystem: " + SystemInfo.operatingSystem);
        info.AppendLine("ProcessorCount: " + SystemInfo.processorCount); 

        info.AppendLine("Profiler.enabled = : " + Profiler.enabled.ToString());
 
        System.GC.Collect();   
        info.AppendLine( string.Format("Total memory: {0:###,###,###,##0} kb" , (System.GC.GetTotalMemory(true))/1024f)); 
 
        return info.ToString();
    }


    #endregion
    #region GUI Window Methods

    void DrawBottomControls()
    {
        GUI.SetNextControlName(ENTRYFIELD);
        _inputString = GUI.TextField(inputRect, _inputString);

        var index = GUI.Toolbar(toolbarRect, toolbarIndex, tabs);

        if (index != toolbarIndex)
        {
            toolbarIndex = index;
        }

        if (GUI.Button(enterButtonRect, "Enter"))
        {
            EvalInputString(_inputString);
            _inputString = string.Empty;
        }

    GUI.DragWindow();

    }

    void LogWindow(int windowID)
    {
        GUI.Box(scrollRect, string.Empty);
        innerRect.height = innerHeight < scrollRect.height ? scrollRect.height : innerHeight;
        _logScrollPos = GUI.BeginScrollView(scrollRect, _logScrollPos, innerRect, false, true);

        if (_messages != null || _messages.Count > 0)
        {
            Color oldColor = GUI.contentColor;

            messageLine.y = 0;
            Message m;
            for (int i = 0; i < _messages.Count; i++)
            {
                m = _messages[i];

                GUI.contentColor = m.color;

                guiContent.text = m.ToGUIString();

                messageLine.height = labelStyle.CalcHeight(guiContent, messageLine.width);

                if (messageLine.height >= scrollRect.y && messageLine.height <= scrollRect.y + 580)
                {
                    GUI.Label(messageLine, guiContent);
                }

                messageLine.y += (messageLine.height + lineOffset);

                innerHeight = messageLine.y > scrollRect.height ? (int)messageLine.y : (int)scrollRect.height;
            }
            GUI.contentColor = oldColor;
        }

        GUI.EndScrollView(); 

        DrawBottomControls();
       // GUI.Button(new Rect(100,100,40,40),"dddd");
    }

    string BuildDisplayString()
    {
        if (_messages == null)
            return string.Empty;

        if (!dirty)
            return _displayString.ToString();

        dirty = false;

        _displayString.Length = 0;
        //foreach (Message m in _messages) {
        //  _displayString.AppendLine(m.ToString());
        //}
        for (int i = 0; i < _messages.Count; i++)
        {
            //collapse
            if (i > 0 && _messages[i].ToString() == _messages[i - 1].ToString())
            {
                continue;
            }
            _displayString.AppendLine(_messages[i].ToString());
        }
        return _displayString.ToString();
    }

    void CopyLogWindow(int windowID)
    {

        guiContent.text = BuildDisplayString();

        var calcHeight = GUI.skin.textArea.CalcHeight(guiContent, messageLine.width);

        innerRect.height = calcHeight < scrollRect.height ? scrollRect.height : calcHeight;

        _rawLogScrollPos = GUI.BeginScrollView(scrollRect, _rawLogScrollPos, innerRect, false, true);

        GUI.TextArea(innerRect, guiContent.text);

        GUI.EndScrollView();

        DrawBottomControls();
    }

    void WatchVarWindow(int windowID)
    {
        GUI.Box(scrollRect, string.Empty);

        innerRect.height = innerHeight < scrollRect.height ? scrollRect.height : innerHeight;

        _watchVarsScrollPos = GUI.BeginScrollView(scrollRect, _watchVarsScrollPos, innerRect, false, true);

        int line = 0;

        //    var bgColor = GUI.backgroundColor;

        nameRect.y = valueRect.y = 0;

        nameRect.x = messageLine.x;

        float totalWidth = messageLine.width - messageLine.x;
        float nameMin;
        float nameMax;
        float valMin;
        float valMax;
        float stepHeight;

        var textAreaStyle = GUI.skin.textArea;

        foreach (var kvp in _watchVarTable)
        {

            var nameContent = new GUIContent(string.Format("{0}:", kvp.Value.Name));
            var valContent = new GUIContent(kvp.Value.ToString());

            labelStyle.CalcMinMaxWidth(nameContent, out nameMin, out nameMax);
            textAreaStyle.CalcMinMaxWidth(valContent, out valMin, out valMax);

            if (nameMax > totalWidth)
            {
                nameRect.width = totalWidth - valMin;
                valueRect.width = valMin;
            }


            else if (valMax + nameMax > totalWidth)
            {
                valueRect.width = totalWidth - nameMin;
                nameRect.width = nameMin;
            }
            else
            {
                valueRect.width = valMax;
                nameRect.width = nameMax;
            }

            nameRect.height = labelStyle.CalcHeight(nameContent, nameRect.width);
            valueRect.height = textAreaStyle.CalcHeight(valContent, valueRect.width);

            valueRect.x = totalWidth - valueRect.width + nameRect.x;

            //      GUI.backgroundColor = line % 2 == 0 ? Color.black : Color.gray;
            GUI.Label(nameRect, nameContent);
            GUI.TextArea(valueRect, valContent.text);

            stepHeight = Mathf.Max(nameRect.height, valueRect.height) + 4;

            nameRect.y += stepHeight;
            valueRect.y += stepHeight;

            innerHeight = valueRect.y > scrollRect.height ? (int)valueRect.y : (int)scrollRect.height;

            line++;
        }

        //    GUI.backgroundColor = bgColor;

        GUI.EndScrollView();

        DrawBottomControls();
    }
    #endregion
    #region InternalFunctionality
    void LogMessage(Message msg)
    {
        ////统计重复出现的Msg
        //  bool isSameMsg = false;
        //  foreach(Message oldMsg in _messages)
        //  {
        //      if (string.Compare(oldMsg.ToString(), msg.ToString()) == 0)
        //      {
        //          //已经出现过该Msg
        //          oldMsg.MsgCountAdd();
        //          isSameMsg = true;
        //          break;
        //      }
        //  }
        //  //全新的消息
        //if(!isSameMsg)
        _messages.Add(msg);


        _logScrollPos.y = 50000.0f;
        _rawLogScrollPos.y = 50000.0f;

        dirty = true;
    }

    //--- Local version. Use the static version above instead.
    void ClearLog()
    {
        _messages.Clear();
    }

    //--- Local version. Use the static version above instead.
    void RegisterCommandCallback(string commandString, DebugCommand commandCallback, string CMD_Discribes)
    {
        try
        {
            _cmdTable[commandString] = new DebugCommand(commandCallback);
            _cmdTableDiscribes.Add(commandString, CMD_Discribes);
        }
        catch (Exception e)
        {
            Debug.Log(e.Message);
        }
    }

    //--- Local version. Use the static version above instead.
    void UnRegisterCommandCallback(string commandString)
    {
        try
        {
            _cmdTable.Remove(commandString);
            _cmdTableDiscribes.Remove(commandString);
        }
        catch (Exception e)
        {
            Debug.Log(e.Message);
        }

    }

    //--- Local version. Use the static version above instead.
    void AddWatchVarToTable(WatchVarBase watchVar)
    {
        _watchVarTable[watchVar.Name] = watchVar;
    }

    //--- Local version. Use the static version above instead.
    void RemoveWatchVarFromTable(string name)
    {
        _watchVarTable.Remove(name);
    }

    void EvalInputString(string inputString)
    {
        var input = inputString.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

        _history.Add(inputString);

        if (input.Length == 0)
        {
            LogMessage(Message.Input(string.Empty));
            return;
        }

        LogMessage(Message.Input(inputString));

        //input = Array.ConvertAll<string, string>(input, (low) => { return low.ToLower(); });
        var cmd = input[0];

        if (_cmdTable.ContainsKey(cmd))
        {
            Log(_cmdTable[cmd](input), MessageType.OUTPUT);
        }
        else
        {
            LogMessage(Message.Output(string.Format("*** Unknown Command: {0} ***", cmd)));
        }
    }
    /// <summary>
    /// 执行一个命令
    /// </summary>
    /// <param name="inputCMD">命令字符串</param>
    public void ExecCMDInputString(string inputCMD)
    {
        EvalInputString(inputCMD);
    }

    #endregion
}

/// <summary>
/// Base class for WatchVars. Provides base functionality.
/// </summary>
public abstract class WatchVarBase
{
    /// <summary>
    /// Name of the WatchVar.
    /// </summary>
    public string Name { get; private set; }

    protected object _value;

    public WatchVarBase(string name, object val)
        : this(name)
    {
        _value = val;
    }

    public WatchVarBase(string name)
    {
        Name = name;
        Register();
    }

    public void Register()
    {
        DebugConsole.RegisterWatchVar(this);
    }

    public void UnRegister()
    {
        DebugConsole.UnRegisterWatchVar(Name);
    }

    public object ObjValue
    {
        get { return _value; }
    }

    public override string ToString()
    {
        if (_value == null)
            return "<null>";

        return _value.ToString();
    }
}

/// <summary>
///
/// </summary>
public class WatchVar<T> : WatchVarBase
{
    public T Value
    {
        get { return (T)_value; }
        set { _value = value; }
    }

    public WatchVar(string name)
        : base(name)
    {

    }

    public WatchVar(string name, T val)
        : base(name, val)
    {

    }
}

public class FPSCounter
{
    public float current = 0.0f;

    public float updateInterval = 0.5f;

    float accum = 0; // FPS accumulated over the interval
    int frames = 100; // Frames drawn over the interval
    float timeleft; // Left time for current interval

    float delta;

    public FPSCounter()
    {
        timeleft = updateInterval;
    }

    public IEnumerator Update()
    {
        while (true)
        {
            delta = Time.deltaTime;

            timeleft -= delta;
            accum += Time.timeScale / delta;
            ++frames;

            // Interval ended - update GUI text and start new interval
            if (timeleft <= 0.0f)
            {
                // display two fractional digits (f2 format)
                current = accum / frames;
                timeleft = updateInterval;
                accum = 0.0f;
                frames = 0;
            }

            yield return null;
        }
    }
}