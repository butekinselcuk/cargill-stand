@echo off
setlocal
title Cargill Stand Gosterisi - Baslatici
cd /d "%~dp0"

set PORT=8787
set "URL=http://localhost:%PORT%/"
set "PF=%ProgramFiles%"
set "PFX=%ProgramFiles(x86)%"
set "LAD=%LocalAppData%"

echo.
echo   CARGILL STAND GOSTERISI
echo   ------------------------------------
echo   Sunucu baslatiliyor...

where node >nul 2>nul
if not errorlevel 1 goto nodeok
echo.
echo   HATA: Node.js bulunamadi.
echo   https://nodejs.org adresinden LTS surumunu kurup tekrar deneyin.
echo.
pause
exit /b 1
:nodeok

rem --- sunucuyu ayri pencerede baslat ---
del /q "%~dp0.server.pid" >nul 2>nul
start "CargillShowServer" /min cmd /c "title CargillShowServer&node "%~dp0server.js" %PORT%"

rem --- sunucu ayaga kalkana kadar bekle (en fazla 20 sn) ---
set /a tries=0
:waitloop
set /a tries+=1
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',%PORT%)).Close();exit 0}catch{exit 1}" >nul 2>nul
if not errorlevel 1 goto serverup
if %tries% GEQ 20 goto serverup
timeout /t 1 /nobreak >nul
goto waitloop
:serverup

set "PROFILE=%LAD%\CargillShowKiosk"
set "FLAGS=--kiosk --start-fullscreen --autoplay-policy=no-user-gesture-required --user-data-dir=%PROFILE% --no-first-run --no-default-browser-check --disable-session-crashed-bubble --disable-infobars --noerrdialogs --disable-translate --overscroll-history-navigation=0 --check-for-update-interval=31536000 --disable-pinch"

set "BROWSER="
if exist "%PF%\Google\Chrome\Application\chrome.exe" set "BROWSER=%PF%\Google\Chrome\Application\chrome.exe"
if exist "%PFX%\Google\Chrome\Application\chrome.exe" set "BROWSER=%PFX%\Google\Chrome\Application\chrome.exe"
if exist "%LAD%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LAD%\Google\Chrome\Application\chrome.exe"
if defined BROWSER goto launch
if exist "%PFX%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%PFX%\Microsoft\Edge\Application\msedge.exe"
if exist "%PF%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%PF%\Microsoft\Edge\Application\msedge.exe"
if defined BROWSER goto launch

echo   Chrome/Edge bulunamadi, varsayilan tarayici aciliyor...
start "" "%URL%"
echo.
echo   Gosteri bitince bu pencereyi kapatin.
pause
goto cleanup

:launch
echo   Tarayici aciliyor (tam ekran)...
echo   Cikis: ALT+F4   ^|   Ayar ekranina donus: ESC
echo.
start "" /wait "%BROWSER%" %FLAGS% "%URL%"

:cleanup
echo   Sunucu kapatiliyor...
if not exist "%~dp0.server.pid" goto killtitle
set /p SRVPID=<"%~dp0.server.pid"
taskkill /pid %SRVPID% /f >nul 2>nul
del /q "%~dp0.server.pid" >nul 2>nul
:killtitle
taskkill /fi "WINDOWTITLE eq CargillShowServer*" /t /f >nul 2>nul
endlocal
