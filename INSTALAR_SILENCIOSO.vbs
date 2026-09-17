' AutoOS - Instalador 100% Oculto e Silencioso
' Executa a instalacao sem abrir nenhuma tela preta do prompt de comando (CMD)

Option Explicit

Dim fso, wsh, currentDir, batPath, retCode
Set fso = CreateObject("Scripting.FileSystemObject")
Set wsh = CreateObject("WScript.Shell")

currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = currentDir & "\INSTALAR_AUTOOS.bat"

If Not fso.FileExists(batPath) Then
    MsgBox "Arquivo de instalacao INSTALAR_AUTOOS.bat nao encontrado nesta pasta.", vbCritical, "AutoOS"
    WScript.Quit 1
End If

' Executa o instalador em segundo plano com janela 100% oculta (0) e aguarda conclusao (True)
retCode = wsh.Run("cmd /c """ & batPath & """ /silent", 0, True)

If retCode = 0 Then
    ' Sucesso silencioso
    WScript.Quit 0
Else
    MsgBox "Ocorreu uma falha durante a instalacao automatica do AutoOS." & vbCrLf & _
           "Verifique se ha permissao de administrador ou execute o INSTALAR_AUTOOS.bat para ver detalhes.", vbExclamation, "AutoOS"
    WScript.Quit 1
End If
