@echo off
setlocal
title BerryProtocol - Parar Dashboard

cd /d "%~dp0"

set "BERRY_DASHBOARD_ROOT=%~dp0"
set "BERRY_DASHBOARD_PID=%~dp0.berry-dashboard.pid"

if not exist "%BERRY_DASHBOARD_PID%" (
  echo.
  echo A dashboard ja esta parada.
  exit /b 0
)

set "BERRY_PID="
set /p BERRY_PID=<"%BERRY_DASHBOARD_PID%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$processId = 0; if (-not [int]::TryParse($env:BERRY_PID, [ref]$processId)) { Remove-Item -LiteralPath $env:BERRY_DASHBOARD_PID -Force -ErrorAction SilentlyContinue; exit 2 }; $process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $processId) -ErrorAction SilentlyContinue; if (-not $process) { Remove-Item -LiteralPath $env:BERRY_DASHBOARD_PID -Force -ErrorAction SilentlyContinue; exit 2 }; if ($process.CommandLine -notlike '*packages\berryapi\dist\server.js*') { exit 3 }; Stop-Process -Id $processId -Force -ErrorAction Stop; Wait-Process -Id $processId -Timeout 10 -ErrorAction SilentlyContinue; Remove-Item -LiteralPath $env:BERRY_DASHBOARD_PID -Force -ErrorAction SilentlyContinue; exit 0"

if errorlevel 3 (
  echo.
  echo ERRO: o PID salvo pertence a outro programa. Nada foi encerrado.
  exit /b 1
)

if errorlevel 2 (
  echo.
  echo A dashboard ja estava parada.
  exit /b 0
)

if errorlevel 1 (
  echo.
  echo ERRO: nao foi possivel encerrar a dashboard.
  exit /b 1
)

echo.
echo Dashboard encerrada com sucesso.
exit /b 0
