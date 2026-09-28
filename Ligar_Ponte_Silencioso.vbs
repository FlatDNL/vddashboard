Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strPath = fso.GetAbsolutePathName(".")
pythonExe = "C:\Users\daniel.reis\AppData\Local\Programs\Python\Python313\pythonw.exe"

If fso.FileExists(pythonExe) Then
    WshShell.Run """" & pythonExe & """" & " """ & strPath & "\profit_bridge.py""", 0, False
Else
    WshShell.Run "pythonw """ & strPath & "\profit_bridge.py""", 0, False
End If
