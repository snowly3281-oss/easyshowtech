@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\publish-site.ps1" %*
set "PUBLISH_EXIT=%ERRORLEVEL%"
echo.
if "%PUBLISH_EXIT%"=="0" (echo Publishing completed successfully.) else (echo Publishing did not complete. Read the error above.)
pause
exit /b %PUBLISH_EXIT%
