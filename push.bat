@echo off
chcp 65001 >nul
setlocal

REM ============================================================
REM  easyshow 一键推送脚本
REM  用法：直接双击；或 push.bat "commit message"
REM ============================================================

cd /d "%~dp0"

if "%~1"=="" (
    set "MSG=update: 同步项目变更"
) else (
    set "MSG=%~1"
)

echo.
echo === easyshow 一键推送 ===
echo 目录: %CD%
echo.

REM 1. 显示当前状态
git status --short
if errorlevel 1 goto :err

REM 2. 全部 add（保留 untracked 备份文件不会被误删，但会一起提交，先提示）
echo.
echo [1/4] git add -A
git add -A
if errorlevel 1 goto :err

REM 3. 看看有没有东西要提交
git diff --cached --quiet
if %errorlevel%==0 (
    echo.
    echo 没有改动需要提交，跳过 commit，直接尝试 push ...
    goto :push
)

REM 4. commit
echo.
echo [2/4] git commit -m "%MSG%"
git commit -m "%MSG%"
if errorlevel 1 goto :err

:push
REM 5. push
echo.
echo [3/4] git push origin main
git push origin main
if errorlevel 1 goto :err

REM 6. 看结果
echo.
echo [4/4] 完成
git log --oneline -3
echo.
echo 推送成功 ^_^
pause
exit /b 0

:err
echo.
echo 失败！查看上面 git 输出。
pause
exit /b 1
