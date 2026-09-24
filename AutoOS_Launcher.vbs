' AutoOS Launcher - Inicializador Otimizado em Janela Nativa
' Inicia o servidor em segundo plano e abre o AutoOS em janela de aplicativo
' Compativel com Windows 10 e Windows 11 (suporte a portas dinamicas)

Option Explicit

Dim fso, wsh, currentDir, nodePath, edgePath, chromePath, appUrl, retCode, isRunning, checkCount, resp, forceRestart
Set fso = CreateObject("Scripting.FileSystemObject")
Set wsh = CreateObject("WScript.Shell")

currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
wsh.CurrentDirectory = currentDir

' Funcao para obter o endereco URL com a porta ativa
Function GetAppUrl()
    Dim targetPort, portFile, portContent
    targetPort = 3000
    If fso.FileExists(currentDir & "\active_port.txt") Then
        On Error Resume Next
        Set portFile = fso.OpenTextFile(currentDir & "\active_port.txt", 1)
        portContent = Trim(portFile.ReadAll)
        portFile.Close
        On Error GoTo 0
        If IsNumeric(portContent) Then
            If CLng(portContent) >= 1000 And CLng(portContent) <= 65535 Then
                targetPort = CLng(portContent)
            End If
        End If
    End If
    GetAppUrl = "http://127.0.0.1:" & targetPort
End Function

' 1. Verificar se a pasta dist essencial existe
If Not fso.FileExists(currentDir & "\dist\index.html") Then
    resp = MsgBox("A pasta compilada 'dist' do AutoOS ainda nao existe nesta instalacao." & vbCrLf & vbCrLf & _
                  "Deseja gerar os arquivos agora automaticamente?" & vbCrLf & _
                  "(Uma janela sera aberta para instalar tudo e compilar o sistema).", _
                  vbQuestion + vbYesNo, "AutoOS - Preparar Arquivos")
    If resp = vbYes Then
        Dim psRunCmd
        psRunCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -Command ""Set-Location -LiteralPath '" & Replace(currentDir, "'", "''") & "'; & '.\instalar.ps1'"""
        wsh.Run psRunCmd, 1, False
        WScript.Quit 0
    Else
        MsgBox "Para instalar e iniciar o AutoOS, execute o arquivo INSTALAR_AUTOOS.bat.", vbInformation, "AutoOS"
        WScript.Quit 1
    End If
End If

' 2. Localizar o executavel do Node.js
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
    ' Testa comando node no PATH do sistema silenciosamente
    On Error Resume Next
    retCode = wsh.Run("cmd /c where node >nul 2>nul", 0, True)
    If retCode = 0 Then
        nodePath = "node"
    End If
    On Error GoTo 0
End If

If nodePath = "" Then
    MsgBox "O Node.js nao foi localizado no seu computador para executar o AutoOS." & vbCrLf & vbCrLf & _
           "Para resolver:" & vbCrLf & _
           "1. De dois cliques em INSTALAR_AUTOOS.bat com conexao a internet; OU" & vbCrLf & _
           "2. Baixe o Node.js oficial gratuito em: https://nodejs.org", vbCritical, "AutoOS - Node.js Nao Encontrado"
    WScript.Quit 1
End If

' 3. Verificar argumentos (/restart ou /force)
forceRestart = False
If WScript.Arguments.Count > 0 Then
    If InStr(LCase(WScript.Arguments(0)), "restart") > 0 Or InStr(LCase(WScript.Arguments(0)), "force") > 0 Then
        forceRestart = True
    End If
End If

isRunning = False
If Not forceRestart Then
    On Error Resume Next
    retCode = wsh.Run("""" & nodePath & """ """ & currentDir & "\verificar_servidor.cjs""", 0, True)
    If retCode = 0 Then
        isRunning = True
    End If
    On Error GoTo 0
End If

' 4. Se nao estiver rodando ou foi forcado restart, inicia o servidor em segundo plano
If Not isRunning Then
    ' Libera processos orfaos ou portas presas usando PowerShell e taskkill
    wsh.Run "powershell -NoProfile -ExecutionPolicy Bypass -Command ""$ports = @(3000,3001,3002,3003); foreach ($p in $ports) { try { Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {} }""", 0, True
    wsh.Run "cmd /c ""for /f ""tokens=5"" %p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do taskkill /F /PID %p >nul 2^>nul""", 0, True
    WScript.Sleep 400

    ' Remove log anterior para diagnostico limpo
    On Error Resume Next
    If fso.FileExists(currentDir & "\servidor.log") Then fso.DeleteFile currentDir & "\servidor.log", True
    On Error GoTo 0

    ' Inicia o servidor direcionando a saida para servidor.log
    wsh.Run "cmd /c """"" & nodePath & """ """ & currentDir & "\servidor.cjs"" > """ & currentDir & "\servidor.log"" 2>&1""", 0, False

    ' Aguarda o servidor responder com verificacoes rapidas (ate 9 segundos)
    checkCount = 0
    Do While checkCount < 25
        WScript.Sleep 350
        retCode = wsh.Run("""" & nodePath & """ """ & currentDir & "\verificar_servidor.cjs""", 0, True)
        If retCode = 0 Then
            isRunning = True
            Exit Do
        End If
        checkCount = checkCount + 1
    Loop
End If

' Se apos a inicializacao o servidor nao responder, informa o usuario com detalhes
If Not isRunning Then
    Dim erroDetalhe
    erroDetalhe = ""
    If fso.FileExists(currentDir & "\servidor.log") Then
        On Error Resume Next
        Dim fLog
        Set fLog = fso.OpenTextFile(currentDir & "\servidor.log", 1)
        erroDetalhe = vbCrLf & vbCrLf & "Detalhes do log:" & vbCrLf & fLog.ReadAll
        fLog.Close
        On Error GoTo 0
    End If

    MsgBox "O servidor do AutoOS nao pode ser iniciado." & erroDetalhe & vbCrLf & vbCrLf & _
           "Experimente executar o arquivo CORRIGIR_TRAVAMENTO.bat ou INICIAR_AUTOOS.bat.", vbCritical, "AutoOS - Erro na Inicializacao"
    WScript.Quit 1
End If

' Obter a URL correta com base na porta ativa detectada
appUrl = GetAppUrl()

' 5. Localizar Microsoft Edge ou Google Chrome para abrir em janela propria de app
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

' 6. Abrir o AutoOS em janela de aplicativo limpa ou no navegador padrao
If edgePath <> "" Then
    wsh.Run """" & edgePath & """ --app=""" & appUrl & """ --start-maximized", 1, False
ElseIf chromePath <> "" Then
    wsh.Run """" & chromePath & """ --app=""" & appUrl & """ --start-maximized", 1, False
Else
    On Error Resume Next
    retCode = wsh.Run("cmd /c start msedge --app=""" & appUrl & """", 0, False)
    If retCode <> 0 Then
        wsh.Run "cmd /c start " & appUrl, 0, False
    End If
    On Error GoTo 0
End If
