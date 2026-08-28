@echo off
setlocal
title BerryProtocol - Iniciar Dashboard

cd /d "%~dp0"

set "BERRY_DASHBOARD_ROOT=%~dp0"
set "BERRY_DASHBOARD_PID=%~dp0.berry-dashboard.pid"
set "BERRY_DASHBOARD_URL=http://127.0.0.1:3000/studio?apiKey=berryapi_local_dashboard"
set "PORT=3000"
set "HOST=127.0.0.1"
set "API_KEY=berryapi_local_dashboard"

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $headers = @{ Authorization = 'Bearer ' + $env:API_KEY }; $response = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/studio/api/capabilities' -Headers $headers -TimeoutSec 2; $listener = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 3000 -State Listen -ErrorAction Stop | Select-Object -First 1; $process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $listener.OwningProcess) -ErrorAction Stop; if ($response.success -and $process.CommandLine -like '*packages\berryapi\dist\server.js*') { Set-Content -LiteralPath $env:BERRY_DASHBOARD_PID -Value $listener.OwningProcess -Encoding ascii; exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  echo.
  echo A dashboard ja esta funcionando em http://127.0.0.1:3000/studio
  if /I not "%BERRY_NO_BROWSER%"=="1" start "" "%BERRY_DASHBOARD_URL%"
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Remove-Item -LiteralPath $env:BERRY_DASHBOARD_PID -Force -ErrorAction SilentlyContinue; $listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($listener) { exit 1 }; exit 0"
if errorlevel 1 goto :port_error

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERRO: Node.js nao foi encontrado neste computador.
  echo Instale o Node.js e execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERRO: npm nao foi encontrado neste computador.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo.
  echo Instalando as dependencias pela primeira vez...
  call npm install
  if errorlevel 1 goto :build_error
)

if /I not "%BERRY_SKIP_BUILD%"=="1" (
  echo.
  echo Preparando a BerryAPI e a dashboard...
  call npm run build
  if errorlevel 1 goto :build_error
)

if not exist "packages\berryapi\dist\server.js" (
  echo.
  echo ERRO: a BerryAPI ainda nao foi compilada.
  echo Execute este arquivo novamente sem BERRY_SKIP_BUILD.
  echo.
  pause
  exit /b 1
)

echo.
echo Iniciando a BerryAPI local...
set "NODE_ENV=production"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$root = $env:BERRY_DASHBOARD_ROOT; $stdout = Join-Path $root '.berry-dashboard.log'; $stderr = Join-Path $root '.berry-dashboard-error.log'; $node = (Get-Command node -ErrorAction Stop).Source; $process = Start-Process -FilePath $node -ArgumentList 'packages\berryapi\dist\server.js' -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru; Set-Content -LiteralPath $env:BERRY_DASHBOARD_PID -Value $process.Id -Encoding ascii"
if errorlevel 1 (
  echo.
  echo ERRO: nao foi possivel iniciar a BerryAPI.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(30); do { try { $processId = [int](Get-Content -Raw -LiteralPath $env:BERRY_DASHBOARD_PID); $process = Get-Process -Id $processId -ErrorAction Stop; $headers = @{ Authorization = 'Bearer ' + $env:API_KEY }; $response = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/studio/api/capabilities' -Headers $headers -TimeoutSec 2; if ($process -and $response.success) { exit 0 } } catch {}; Start-Sleep -Milliseconds 500 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 goto :start_error

echo.
echo Dashboard pronta: http://127.0.0.1:3000/studio
echo Para encerrar, execute parar-dashboard.cmd.
echo.

if /I not "%BERRY_NO_BROWSER%"=="1" start "" "%BERRY_DASHBOARD_URL%"
exit /b 0

:build_error
echo.
echo ERRO: nao foi possivel preparar o projeto.
echo Revise as mensagens acima e tente novamente.
echo.
pause
exit /b 1

:port_error
echo.
echo ERRO: a porta 3000 ja esta sendo usada por outro programa.
echo Encerre esse programa e execute iniciar-dashboard.cmd novamente.
echo.
pause
exit /b 1

:start_error
call "%~dp0parar-dashboard.cmd" >nul 2>&1
echo.
echo ERRO: a BerryAPI nao respondeu em ate 30 segundos.
echo Consulte os arquivos:
echo   %~dp0.berry-dashboard.log
echo   %~dp0.berry-dashboard-error.log
echo.
pause
exit /b 1
