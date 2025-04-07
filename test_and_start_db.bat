@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo BLIPP DATABASE CONNECTION TEST AND STARTER
echo ====================================================
echo.

:: Check if the database server is already running
echo Checking if database server is already running...

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -TimeoutSec 2 -ErrorAction Stop; if ($response.StatusCode -eq 200) { Write-Host 'Database server is already running!' -ForegroundColor Green; exit 0 } } catch { Write-Host 'Database server is not running' -ForegroundColor Yellow; exit 1 }" > nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Database server is already running!
    echo You can now use the database in your game.
    echo.
    echo To test the connection further, open:
    echo   db_connection_test.html
    echo.
    goto :end
)

echo Database server is not running.
echo.

:: Ask if user wants to start the server
set /p start_server="Do you want to start the database server now? (Y/N): "

if /i "%start_server%"=="Y" (
    echo.
    echo Starting database server...
    echo.
    
    :: Get the full path to the current directory
    set "SCRIPT_DIR=%~dp0"
    
    :: Start the server using the full path
    start "Database Server" cmd /c "python "%SCRIPT_DIR%game_db.py" & pause"
    
    echo.
    echo Database server should now be starting in a new window.
    echo.
    echo After the server starts, you can test the connection by opening:
    echo   db_connection_test.html
    echo.
) else (
    echo.
    echo Database server not started.
    echo.
)

:end
pause
