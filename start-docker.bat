@echo off
setlocal EnableExtensions
title AgriTrace - Docker Start

set "ROOT=%~dp0"

echo ==========================================
echo        AGRITRACE DOCKER AUTO START
echo ==========================================
echo.

where docker >nul 2>nul
if errorlevel 1 (
  echo Khong tim thay Docker.
  echo Hay cai Docker Desktop truoc roi chay lai file nay.
  echo.
  pause
  exit /b 1
)

docker compose version >nul 2>nul
if errorlevel 1 (
  echo Docker da cai, nhung chua co docker compose.
  echo Hay cap nhat Docker Desktop roi thu lai.
  echo.
  pause
  exit /b 1
)

cd /d "%ROOT%"

echo Dang build va khoi dong mongo + blockchain + api + web...
echo.
docker compose up --build

echo.
pause
