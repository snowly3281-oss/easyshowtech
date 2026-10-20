@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\publish-site.ps1" %*
set "PUBLISH_EXIT=%ERRORLEVEL%"
pause
exit /b %PUBLISH_EXIT%
