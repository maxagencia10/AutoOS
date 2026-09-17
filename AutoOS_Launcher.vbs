' AutoOS Launcher - Inicializador Otimizado em Janela Nativa
' Inicia o servidor em segundo plano e abre o AutoOS em janela de aplicativo

Option Explicit

Dim fso, wsh, currentDir, nodePath, edgePath, chromePath, appUrl, retCode, isRunning, checkCount
Set fso = CreateObject("Scripting.FileSystemObject")
Set wsh = CreateObject("WScript.Shell")

currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
appUrl = "http://127.0.0.1:3000"

' 1. Verificar se a pasta dist essencial existe
If Not fso.FileExists(currentDir & "\dist\index.html") Then
    MsgBox "A pasta 'dist' do AutoOS não foi encontrada nesta pasta:" & vbCrLf & _
           currentDir & vbCrLf & vbCrLf & _
           "Por favor, execute o arquivo INSTALAR_AUTOOS.bat ou reextraia todo o conteúdo do arquivo ZIP baixado.", vbCritical, "AutoOS - Arquivos Não Encontrados"
    WScript.Quit 1
End If

' 2. Localizar o executável do Node.js
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
    MsgBox "O Node.js não foi localizado no seu computador para executar o AutoOS." & vbCrLf & vbCrLf & _
           "Para resolver:" & vbCrLf & _
           "1. Dê dois cliques em INSTALAR_AUTOOS.bat com conexão à internet; OU" & vbCrLf & _
           "2. Baixe o Node.js oficial gratuito em: https://nodejs.org", vbCritical, "AutoOS - Node.js Não Encontrado"
    WScript.Quit 1
End If

' 3. Verificar se o servidor já está rodando
isRunning = False
On Error Resume Next
retCode = wsh.Run("""" & nodePath & """ """ & currentDir & "\verificar_servidor.cjs""", 0, True)
If retCode = 0 Then
    isRunning = True
End If
On Error GoTo 0

' 4. Se não estiver rodando, inicia o servidor em segundo plano com log de diagnóstico
If Not isRunning Then
    ' Libera processos órfãos antigos na porta 3000
    wsh.Run "cmd /c ""for /f ""tokens=5"" %p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do taskkill /F /PID %p >nul 2^>nul""", 0, True

    ' Inicia o servidor direcionando a saída para servidor.log
    wsh.Run "cmd /c """"" & nodePath & """ """ & currentDir & "\servidor.cjs"" > """ & currentDir & "\servidor.log"" 2>&1""", 0, False

    ' Aguarda o servidor responder com verificações rápidas (máximo 6 segundos)
    checkCount = 0
    Do While checkCount < 20
        WScript.Sleep 300
        retCode = wsh.Run("""" & nodePath & """ """ & currentDir & "\verificar_servidor.cjs""", 0, True)
        If retCode = 0 Then
            isRunning = True
            Exit Do
        End If
        checkCount = checkCount + 1
    Loop
End If

' Se após a inicialização o servidor não responder, informa o usuário com detalhes
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

    MsgBox "O servidor do AutoOS não pôde ser iniciado." & erroDetalhe & vbCrLf & vbCrLf & _
           "Experimente executar o arquivo CORRIGIR_TRAVAMENTO.bat ou INICIAR_AUTOOS.bat.", vbCritical, "AutoOS - Erro na Inicialização"
    WScript.Quit 1
End If

' 5. Localizar Microsoft Edge ou Google Chrome para abrir em janela própria de app
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

' 6. Abrir o AutoOS em janela de aplicativo limpa ou no navegador padrão
If edgePath <> "" Then
    wsh.Run """" & edgePath & """ --app=""" & appUrl & """ --start-maximized", 1, False
ElseIf chromePath <> "" Then
    wsh.Run """" & chromePath & """ --app=""" & appUrl & """ --start-maximized", 1, False
Else
    ' Se não encontrar caminhos explícitos, tenta abrir o Edge via start ou o navegador padrão
    On Error Resume Next
    retCode = wsh.Run("cmd /c start msedge --app=""" & appUrl & """", 0, False)
    If retCode <> 0 Then
        wsh.Run "cmd /c start " & appUrl, 0, False
    End If
    On Error GoTo 0
End If

