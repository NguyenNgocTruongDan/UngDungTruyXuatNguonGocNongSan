@echo off
setlocal EnableExtensions EnableDelayedExpansion
title AgriTrace - Install and Run All

set "ROOT=%~dp0"
set "BLOCKCHAIN_DIR=%ROOT%Source code\blockchain"
set "API_DIR=%ROOT%Source code\api"
set "WEB_DIR=%ROOT%Source code\web"
set "API_ENV=%API_DIR%\.env"
set "API_ENV_EXAMPLE=%API_DIR%\.env.example"
set "DEPLOY_LOG=%TEMP%\agri-trace-deploy.log"
set "HARDHAT_DEFAULT_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo ==================================================
echo              AGRITRACE AUTO START
echo ==================================================
echo.

call :require_dir "%BLOCKCHAIN_DIR%" "blockchain"
if errorlevel 1 goto :fail

call :require_dir "%API_DIR%" "api"
if errorlevel 1 goto :fail

call :require_dir "%WEB_DIR%" "web"
if errorlevel 1 goto :fail

call :require_command node
if errorlevel 1 goto :fail

call :require_command npm
if errorlevel 1 goto :fail

echo [1/7] Cai dependencies...
call :install_project "%BLOCKCHAIN_DIR%" "Blockchain"
if errorlevel 1 goto :fail

call :install_project "%API_DIR%" "API"
if errorlevel 1 goto :fail

call :install_project "%WEB_DIR%" "Web"
if errorlevel 1 goto :fail

echo.
echo [2/7] Chuan bi file .env cho API...
call :prepare_api_env
if errorlevel 1 goto :fail

echo.
echo [3/7] Cap nhat cau hinh local cho API...
call :set_env_value "%API_ENV%" "PORT" "5000"
if errorlevel 1 goto :fail
call :set_env_value "%API_ENV%" "NODE_ENV" "development"
if errorlevel 1 goto :fail
call :set_env_value "%API_ENV%" "BLOCKCHAIN_RPC_URL" "http://127.0.0.1:8545"
if errorlevel 1 goto :fail
call :set_env_value "%API_ENV%" "BLOCKCHAIN_PRIVATE_KEY" "%HARDHAT_DEFAULT_PRIVATE_KEY%"
if errorlevel 1 goto :fail
call :set_env_value "%API_ENV%" "FRONTEND_URL" "http://localhost:3000"
if errorlevel 1 goto :fail

echo.
echo [4/7] Mo Hardhat node...
start "AgriTrace Blockchain Node" cmd /k "cd /d ""%BLOCKCHAIN_DIR%"" && npm run node"

echo Dang cho blockchain khoi dong...
call :wait_for_port 127.0.0.1 8545 60
if errorlevel 1 (
  echo Khong the ket noi toi blockchain local tai 127.0.0.1:8545
  goto :fail
)

echo.
echo [5/7] Deploy contract local...
pushd "%BLOCKCHAIN_DIR%" >nul
call npm run deploy:local > "%DEPLOY_LOG%" 2>&1
set "DEPLOY_EXIT=%ERRORLEVEL%"
popd >nul

type "%DEPLOY_LOG%"

if not "%DEPLOY_EXIT%"=="0" (
  echo.
  echo Deploy contract that bai.
  goto :fail
)

set "CONTRACT_ADDRESS="
for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"CONTRACT_ADDRESS=" "%DEPLOY_LOG%"`) do (
  if /i "%%A"=="CONTRACT_ADDRESS" set "CONTRACT_ADDRESS=%%B"
)

if not defined CONTRACT_ADDRESS (
  echo.
  echo Khong doc duoc CONTRACT_ADDRESS tu log deploy.
  goto :fail
)

echo.
echo Contract vua deploy: %CONTRACT_ADDRESS%
call :set_env_value "%API_ENV%" "CONTRACT_ADDRESS" "%CONTRACT_ADDRESS%"
if errorlevel 1 goto :fail

echo.
echo [6/7] Mo API...
start "AgriTrace API" cmd /k "cd /d ""%API_DIR%"" && npm run dev"

echo Dang cho API khoi dong...
call :wait_for_port 127.0.0.1 5000 45
if errorlevel 1 (
  echo API chua san sang tai http://127.0.0.1:5000
  goto :fail
)

echo.
echo [7/7] Mo Web...
start "AgriTrace Web" cmd /k "cd /d ""%WEB_DIR%"" && npm start"

echo.
echo ==================================================
echo Da cai dat va khoi dong xong.
echo Web: http://localhost:3000
echo API: http://localhost:5000
echo Blockchain RPC: http://127.0.0.1:8545
echo Contract: %CONTRACT_ADDRESS%
echo ==================================================
echo.
echo Neu day la lan dau, hay doi Web build xong trong cua so moi.
echo.
pause
exit /b 0

:require_dir
if exist "%~1" exit /b 0
echo Khong tim thay thu muc %~2: %~1
exit /b 1

:require_command
where %~1 >nul 2>nul
if errorlevel 1 (
  echo Chua tim thay lenh "%~1".
  echo Hay cai Node.js truoc, sau do chay lai file nay.
  exit /b 1
)
exit /b 0

:install_project
set "TARGET_DIR=%~1"
set "TARGET_NAME=%~2"
echo   - %TARGET_NAME%
pushd "%TARGET_DIR%" >nul
call npm install --no-fund --no-audit
set "INSTALL_EXIT=%ERRORLEVEL%"
popd >nul
exit /b %INSTALL_EXIT%

:prepare_api_env
if exist "%API_ENV%" (
  echo File .env da ton tai.
  exit /b 0
)

if not exist "%API_ENV_EXAMPLE%" (
  echo Khong tim thay file mau .env.example trong API.
  exit /b 1
)

copy /y "%API_ENV_EXAMPLE%" "%API_ENV%" >nul
if errorlevel 1 (
  echo Khong tao duoc file .env cho API.
  exit /b 1
)

echo Da tao %API_ENV% tu .env.example
exit /b 0

:set_env_value
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$path = '%~1';" ^
  "$key = '%~2';" ^
  "$value = '%~3';" ^
  "$content = @(); if (Test-Path $path) { $content = Get-Content -Path $path; }" ^
  "$updated = $false;" ^
  "$content = $content | ForEach-Object { if ($_ -match ('^' + [regex]::Escape($key) + '=')) { $updated = $true; '{0}={1}' -f $key, $value } else { $_ } };" ^
  "if (-not $updated) { $content += ('{0}={1}' -f $key, $value) };" ^
  "Set-Content -Path $path -Value $content -Encoding UTF8"
if errorlevel 1 exit /b 1
exit /b 0

:wait_for_port
set "WAIT_HOST=%~1"
set "WAIT_PORT=%~2"
set "WAIT_RETRIES=%~3"
set /a WAIT_COUNT=0

:wait_for_port_loop
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $client = New-Object System.Net.Sockets.TcpClient('%WAIT_HOST%', %WAIT_PORT%); $client.Close(); exit 0 } catch { exit 1 }"
if not errorlevel 1 exit /b 0

set /a WAIT_COUNT+=1
if !WAIT_COUNT! GEQ %WAIT_RETRIES% exit /b 1

timeout /t 2 /nobreak >nul
goto :wait_for_port_loop

:fail
echo.
echo Qua trinh khoi dong bi dung lai.
echo Kiem tra thong bao loi o phia tren roi chay lai start-all.bat
echo.
pause
exit /b 1
