@echo off
echo Closing any existing game instances...
taskkill /F /IM "msedge.exe" /T >nul 2>&1
taskkill /F /IM "chrome.exe" /T >nul 2>&1
taskkill /F /IM "firefox.exe" /T >nul 2>&1

echo Starting new game instance...
start index.html
echo Game launched successfully! 