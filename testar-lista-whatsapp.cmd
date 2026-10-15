@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title BerryProtocol - Teste de lista do WhatsApp

if not exist "node_modules\.bin\tsc.cmd" (
  echo Dependencias nao encontradas. Execute npm install antes deste teste.
  pause
  exit /b 1
)

call "node_modules\.bin\tsc.cmd" -b packages/events packages/transport packages/protocol packages/messages packages/wa-message packages/media packages/store packages/auth packages/socket packages/core >nul
if errorlevel 1 (
  echo.
  echo Nao foi possivel compilar o BerryProtocol.
  pause
  exit /b 1
)

node "scripts\testar-lista-whatsapp.js"
set "BERRY_EXIT_CODE=%ERRORLEVEL%"

if not "%BERRY_EXIT_CODE%"=="0" (
  echo.
  echo O teste terminou com erro.
  pause
)

exit /b %BERRY_EXIT_CODE%
