' AutoOS Launcher - Inicializador Silencioso em Janela Nativa
' Inicia o servidor em segundo plano (sem tela preta) e abre o AutoOS como janela de aplicativo

Option Explicit

Dim fso, wsh, currentDir, nodePath, edgePath, chromePath, appUrl, retCode
Set fso = CreateObject("Scripting.FileSystemObject")
Set wsh = CreateObject("WScript.Shell")

currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
appUrl = "http://127.0.0.1:3000"

' 1. Localizar o executável do Node.js (embutido na pasta, no sistema ou no PATH)
nodePath = ""
If fso.FileExists(currentDir & "\runtime\node.exe") Then
    nodePath = currentDir & "\runtime\node.exe"
ElseIf fso.FileExists(currentDir & "\node\node.exe") Then
    nodePath = currentDir & "\node\node.exe"
ElseIf fso.FileExists(wsh.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe") Then
    nodePath = wsh.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"
ElseIf fso.FileExists(wsh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\nodejs\node.exe") Then
    nodePath = wsh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\nodejs\node.exe"
ElseIf fso.FileExists(wsh.ExpandEnvironmentStrings("%LocalAppData%") & "\Programs\node\node.exe") Then
    nodePath = wsh.ExpandEnvironmentStrings("%LocalAppData%") & "\Programs\node\node.exe"
Else
    ' Testa comando node no PATH
    On Error Resume Next
    Dim testExec
    Set testExec = wsh.Exec("node -v")
    If Err.Number = 0 Then
        nodePath = "node"
    End If
    On Error GoTo 0
End If

If nodePath = "" Then
    MsgBox "O Node.js não foi localizado para iniciar o AutoOS." & vbCrLf & _
           "Por favor, execute o arquivo INSTALAR_AUTOOS.bat com conexão à internet " & vbCrLf & _
           "ou coloque o instalador do Node.js na pasta do sistema.", vbCritical, "AutoOS - Erro de Inicialização"
    WScript.Quit 1
End If

' 2. Verificar se o servidor já está rodando
Dim isRunning
isRunning = False
On Error Resume Next
retCode = wsh.Run("""" & nodePath & """ """ & currentDir & "\verificar_servidor.cjs""", 0, True)
If retCode = 0 Then
    isRunning = True
End If
On Error GoTo 0

' 3. Se não estiver rodando, inicia o servidor em segundo plano (0 = Invisível)
If Not isRunning Then
    ' Libera processos órfãos na porta 3000
    wsh.Run "cmd /c ""for /f ""tokens=5"" %p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do taskkill /F /PID %p >nul 2^>nul""", 0, True

    ' Inicia o servidor do AutoOS sem exibir janela (0)
    wsh.Run """" & nodePath & """ """ & currentDir & "\servidor.cjs""", 0, False

    ' Aguarda sincronização garantida do servidor (HTTP 200)
    Dim checkCount
    checkCount = 0
    Do While checkCount < 40
        WScript.Sleep 250
        retCode = wsh.Run("""" & nodePath & """ """ & currentDir & "\verificar_servidor.cjs""", 0, True)
        If retCode = 0 Then
            isRunning = True
            Exit Do
        End If
        checkCount = checkCount + 1
    Loop
End If

' 4. Localizar Microsoft Edge ou Google Chrome para abrir em janela nativa de aplicativo Windows
edgePath = ""
chromePath = ""

If fso.FileExists(wsh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe") Then
    edgePath = wsh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe"
ElseIf fso.FileExists(wsh.ExpandEnvironmentStrings("%ProgramFiles%") & "\Microsoft\Edge\Application\msedge.exe") Then
    edgePath = wsh.ExpandEnvironmentStrings("%ProgramFiles%") & "\Microsoft\Edge\Application\msedge.exe"
ElseIf fso.FileExists(wsh.ExpandEnvironmentStrings("%LocalAppData%") & "\Microsoft\Edge\Application\msedge.exe") Then
    edgePath = wsh.ExpandEnvironmentStrings("%LocalAppData%") & "\Microsoft\Edge\Application\msedge.exe"
End If

If fso.FileExists(wsh.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe") Then
    chromePath = wsh.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists(wsh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Google\Chrome\Application\chrome.exe") Then
    chromePath = wsh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists(wsh.ExpandEnvironmentStrings("%LocalAppData%") & "\Google\Chrome\Application\chrome.exe") Then
    chromePath = wsh.ExpandEnvironmentStrings("%LocalAppData%") & "\Google\Chrome\Application\chrome.exe"
End If

' 5. Abre como aplicativo nativo em janela própria do Windows
If edgePath <> "" Then
    wsh.Run """" & edgePath & """ --app=""" & appUrl & """ --start-maximized", 1, False
ElseIf chromePath <> "" Then
    wsh.Run """" & chromePath & """ --app=""" & appUrl & """ --start-maximized", 1, False
Else
    ' Fallback para o navegador padrão do Windows se não houver Edge ou Chrome
    wsh.Run "cmd /c start " & appUrl, 0, False
End If
