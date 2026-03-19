@echo off
setlocal

set "ROOT=%~dp0"
set "BLOCKCHAIN_DIR=%ROOT%Source code\blockchain"
set "API_DIR=%ROOT%Source code\api"
set "WEB_DIR=%ROOT%Source code\web"

if not exist "%BLOCKCHAIN_DIR%" (
  echo Khong tim thay thu muc blockchain: %BLOCKCHAIN_DIR%
  pause
  exit /b 1
)

if not exist "%API_DIR%" (
  echo Khong tim thay thu muc api: %API_DIR%
  pause
  exit /b 1
)

if not exist "%WEB_DIR%" (
  echo Khong tim thay thu muc web: %WEB_DIR%
  pause
  exit /b 1
)

echo Dang mo Hardhat node...
start "AgriTrace Blockchain Node" cmd /k "cd /d ""%BLOCKCHAIN_DIR%"" && npm run node"

echo Cho blockchain khoi dong...
timeout /t 6 /nobreak >nul

echo Dang deploy contract local...
cd /d "%BLOCKCHAIN_DIR%"
call npm run deploy:local
if errorlevel 1 (
  echo Deploy contract that bai.
  pause
  exit /b 1
)

echo Dang mo API...
start "AgriTrace API" cmd /k "cd /d ""%API_DIR%"" && npm run dev"

echo Cho API khoi dong...
timeout /t 4 /nobreak >nul

echo Dang mo Web...
start "AgriTrace Web" cmd /k "cd /d ""%WEB_DIR%"" && npm start"

echo.
echo Da khoi dong xong.
echo Web: http://localhost:3000
echo API: http://localhost:5000
echo Blockchain RPC: http://127.0.0.1:8545
echo.
pause
