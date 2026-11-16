@echo off
chcp 65001 > nul
title Truyện Reader - Khởi chạy ứng dụng máy tính Windows
echo ========================================================
echo   TRUYỆN READER — ỨNG DỤNG MÁY TÍNH WINDOWS
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Kiểm tra Backend port 8080
netstat -ano | findstr ":8080" | findstr "LISTENING" > nul
if %ERRORLEVEL% NEQ 0 (
    echo [1/3] Đang khởi động Backend máy chủ nội bộ (port 8080)...
    start /b "" java -jar "%~dp0truyen-reader\target\truyen-reader-0.0.1.jar" > nul 2>&1
) else (
    echo [1/3] Backend máy chủ nội bộ đã sẵn sàng (port 8080).
)

:: 2. Kiểm tra Frontend Next.js port 3000
netstat -ano | findstr ":3000" | findstr "LISTENING" > nul
if %ERRORLEVEL% NEQ 0 (
    echo [2/3] Đang khởi động giao diện Next.js (port 3000)...
    start /b "" cmd /c "npm --prefix frontend run dev > nul 2>&1"
    timeout /t 3 /nobreak > nul
) else (
    echo [2/3] Giao diện Next.js đã sẵn sàng (port 3000).
)

:: 3. Mở cửa sổ ứng dụng Windows Desktop
echo [3/3] Đang mở cửa sổ ứng dụng Truyện Reader...
echo.
echo Bạn có thể thu nhỏ cửa sổ này lại.
cd frontend
npx electron electron/main.js
