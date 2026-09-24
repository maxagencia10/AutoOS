# ===============================================================================
# AUTOOS - INSTALADOR E PREPARADOR COMPLETO
# Gestão de Oficina Mecânica
# ===============================================================================

$host.UI.RawUI.WindowTitle = "AutoOS - Instalador e Preparador do Sistema"
Clear-Host

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "          AUTOOS - INSTALACAO COMPLETA E PREPARACAO DA OFICINA" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este assistente ira configurar tudo automaticamente no seu computador." -ForegroundColor White
Write-Host "Caminho da instalacao: $((Get-Location).Path)" -ForegroundColor Gray
Write-Host ""

# 0. LIBERAR PORTA E FINALIZAR INSTANCIAS ANTERIORES
Write-Host "[0/4] Verificando e liberando processos anteriores na porta 3000..." -ForegroundColor Gray
try {
    cmd /c "for /f ""tokens=5"" %p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do taskkill /F /PID %p >nul 2^>nul"
} catch {}

# 1. VERIFICAR OU INSTALAR O NODE.JS
Write-Host "[1/4] Verificando ambiente Node.js..." -ForegroundColor Yellow

$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    $paths = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe",
        "$env:LocalAppData\Programs\node\node.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path -LiteralPath $p) {
            $env:PATH = (Split-Path $p) + ";" + $env:PATH
            $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
            break
        }
    }
}

if (-not $nodeCmd) {
    Write-Host ""
    Write-Host "[!] Node.js nao encontrado no computador." -ForegroundColor Yellow
    Write-Host "Baixando instalador oficial do Node.js (v20 LTS)..." -ForegroundColor Cyan
    Write-Host "Aguarde alguns instantes (cerca de 30 MB)..." -ForegroundColor Gray
    
    $msiPath = Join-Path $env:TEMP "nodejs_installer.msi"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi" -OutFile $msiPath -UseBasicParsing
        
        Write-Host "Instalando Node.js..." -ForegroundColor Yellow
        Write-Host "Se o Windows exibir uma janela de Administrador pedindo permissao, clique em 'SIM'." -ForegroundColor Magenta
        
        $process = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$msiPath`" /passive /norestart" -Wait -PassThru
        if (Test-Path -LiteralPath $msiPath) { Remove-Item -LiteralPath $msiPath -Force -ErrorAction SilentlyContinue }
        
        $nodePath = "$env:ProgramFiles\nodejs"
        if (Test-Path -LiteralPath "$nodePath\node.exe") {
            $env:PATH = "$nodePath;" + $env:PATH
        }
    } catch {
        Write-Host "[AVISO ao baixar Node.js automaticamente]: $_" -ForegroundColor Yellow
    }
}

$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host ""
    Write-Host "-------------------------------------------------------------------------------" -ForegroundColor Red
    Write-Host "[ATENCAO] O Node.js precisa ser instalado no seu computador para rodar o AutoOS." -ForegroundColor Red
    Write-Host "1. Baixe o instalador oficial gratuito em: https://nodejs.org" -ForegroundColor White
    Write-Host "2. Instale normalmente clicando em 'Next' ate concluir." -ForegroundColor White
    Write-Host "3. Em seguida, de dois cliques em INSTALAR_AUTOOS.bat novamente." -ForegroundColor White
    Write-Host "-------------------------------------------------------------------------------" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para fechar esta janela"
    exit 1
}

$nodeVer = & node -v
Write-Host "[OK] Node.js ativo: $nodeVer" -ForegroundColor Green
Write-Host ""

# 2. INSTALAR DEPENDÊNCIAS DO PROJETO (node_modules)
Write-Host "[2/4] Verificando dependencias do sistema..." -ForegroundColor Yellow
if (-not (Test-Path -LiteralPath "node_modules\vite")) {
    Write-Host "Instalando dependencias necessarias do AutoOS..." -ForegroundColor Cyan
    Write-Host "Isso ocorre apenas na primeira vez e leva cerca de 1 minuto. Aguarde..." -ForegroundColor Gray
    
    # Chama o npm usando cmd para garantir compatibilidade total no Windows
    cmd /c "npm install"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tentando instalacao alternativa..." -ForegroundColor Yellow
        cmd /c "npm install --force"
    }
} else {
    Write-Host "[OK] Modulos e dependencias ja estao presentes!" -ForegroundColor Green
}
Write-Host ""

# 3. COMPILAR A PASTA 'dist' DE ALTA PERFORMANCE
Write-Host "[3/4] Compilando arquivos de producao (pasta dist)..." -ForegroundColor Yellow

# Compila diretamente usando o Node.js puro (build.cjs), imune ao bug do caractere '&' no Windows
& node build.cjs


if (-not (Test-Path -LiteralPath "dist\index.html")) {
    Write-Host ""
    Write-Host "-------------------------------------------------------------------------------" -ForegroundColor Red
    Write-Host "[ERRO] A compilacao da pasta 'dist' nao gerou o arquivo index.html." -ForegroundColor Red
    Write-Host "Verifique as mensagens exibidas acima." -ForegroundColor Yellow
    Write-Host "-------------------------------------------------------------------------------" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para fechar esta janela"
    exit 1
}
Write-Host "[OK] Pasta 'dist' compilada com sucesso!" -ForegroundColor Green
Write-Host ""

# 4. CRIAR ATALHO NA ÁREA DE TRABALHO
Write-Host "[4/4] Criando atalho 'AutoOS Oficina' na Area de Trabalho..." -ForegroundColor Yellow
try {
    $ws = New-Object -ComObject WScript.Shell
    $desktop = [Environment]::GetFolderPath('Desktop')
    $shortcutPath = Join-Path $desktop "AutoOS Oficina.lnk"
    $shortcut = $ws.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "$env:SystemRoot\System32\wscript.exe"
    $launcherPath = Join-Path (Get-Location).Path "AutoOS_Launcher.vbs"
    $shortcut.Arguments = "`"$launcherPath`""
    $shortcut.WorkingDirectory = (Get-Location).Path
    $shortcut.Description = "AutoOS - Gestao de Oficina Mecanica"
    $iconPath = Join-Path (Get-Location).Path "dist\favicon.ico"
    if (Test-Path -LiteralPath $iconPath) {
        $shortcut.IconLocation = $iconPath
    }
    $shortcut.Save()
    Write-Host "[OK] Atalho criado na sua Area de Trabalho com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Nao foi possivel criar o atalho automaticamente: $_" -ForegroundColor Yellow
}
Write-Host ""

# 5. INICIAR O SISTEMA EM SEGUNDO PLANO (PROCESSO OCULTO)
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "             AUTOOS INSTALADO E CONFIGURADO COM SUCESSO!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "[OK] Iniciando o servidor em SEGUNDO PLANO (processo 100% invisivel)..." -ForegroundColor Yellow

$launcherPath = Join-Path (Get-Location).Path "AutoOS_Launcher.vbs"
$appUrl = "http://127.0.0.1:3000"

if (Test-Path -LiteralPath $launcherPath) {
    # Inicia diretamente pelo launcher que roda o servidor oculto e abre em janela de app
    Start-Process -FilePath "$env:SystemRoot\System32\wscript.exe" -ArgumentList "`"$launcherPath`" /restart"
} else {
    # Fallback seguro: Inicia o Node.js em processo desacoplado totalmente oculto (WindowStyle Hidden)
    try {
        $nodeExe = "node"
        Start-Process -FilePath $nodeExe -ArgumentList "servidor.cjs" -WorkingDirectory (Get-Location).Path -WindowStyle Hidden
    } catch {
        Start-Process -FilePath "node" -ArgumentList "servidor.cjs" -WindowStyle Hidden
    }

    Start-Sleep -Seconds 2

    # Abre a janela do aplicativo
    try {
        $edgePaths = @(
            "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
            "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
            "$env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
        )
        $opened = $false
        foreach ($ep in $edgePaths) {
            if (Test-Path -LiteralPath $ep) {
                Start-Process -FilePath $ep -ArgumentList "--app=`"$appUrl`" --start-maximized"
                $opened = $true
                break
            }
        }
        if (-not $opened) {
            Start-Process $appUrl
        }
    } catch {
        Start-Process $appUrl
    }
}

Write-Host "[OK] Sistema carregado com sucesso!" -ForegroundColor Green
Write-Host "[OK] O processo do servidor permanece ativo em segundo plano." -ForegroundColor White
Write-Host "[OK] Nenhuma janela ou tela preta precisa ficar visivel para o cliente." -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "Fechando esta janela de instalacao em 3 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Encerra o processo da janela do instalador com sucesso (o servidor continua rodando em segundo plano)
exit 0
