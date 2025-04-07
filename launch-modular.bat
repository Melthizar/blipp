@echo off
echo ========================================
echo  PIXEL ROBOT PLATFORMER - JETPACK EDITION
echo ========================================
echo.
echo Launching modular version with jetpack...

rem Close any existing browser tabs with our game to prevent conflicts
taskkill /F /IM msedge.exe /FI "WINDOWTITLE eq *Pixel Robot*" > nul 2>&1
taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq *Pixel Robot*" > nul 2>&1
taskkill /F /IM firefox.exe /FI "WINDOWTITLE eq *Pixel Robot*" > nul 2>&1

rem Add a timestamp to prevent caching
set timestamp=%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%

rem Launch the modular version
start "" "modular-game.html?t=%timestamp%"

echo.
echo Game launched successfully!
echo.
echo Enjoy the jetpack functionality!
echo. 