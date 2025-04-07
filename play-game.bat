@echo off
echo =================================
echo  PIXEL ROBOT PLATFORMER LAUNCHER
echo =================================
echo.
echo Preparing to launch the game...
echo.

rem Launch the game directly with no cache
start "" "playgame.html"

echo.
echo Game launched successfully!
echo.
rem Wait for a moment
ping -n 4 127.0.0.1 > nul 