@echo off
echo Starting Blipp Game Database Server...
echo.
echo Make sure you have the required Python packages installed:
echo pip install flask flask-cors
echo.

:: Use the full path to ensure the script runs correctly
python "%~dp0game_db.py"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error starting database server!
    echo Please check that Python is installed and the required packages are available.
    echo.
)

pause
