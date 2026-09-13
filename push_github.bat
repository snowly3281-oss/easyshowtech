@echo off
chcp 65001
setlocal enabledelayedexpansion

echo ==========================================
echo  GitHub 推送脚本
echo ==========================================
echo.

set GIT_PATH="D:\Program Files\Git\bin\git.exe"
set REPO_URL=https://github.com/snowly3281-oss/easyshowtech.git

cd /d E:\easyshow

echo [1/4] 检查 Git 状态...
%GIT_PATH% status

echo.
echo [2/4] 配置远程仓库...
%GIT_PATH% remote remove origin 2>nul
%GIT_PATH% remote add origin %REPO_URL%
%GIT_PATH% remote -v

echo.
echo [3/4] 切换到 main 分支...
%GIT_PATH% branch -M main

echo.
echo [4/4] 推送到 GitHub...
echo 注意：如果提示输入用户名密码，请输入：
echo   用户名: snowly3281-oss 或 SnowLi
echo   密码: 你的 GitHub Personal Access Token (PAT)
echo.
%GIT_PATH% push -u origin main

echo.
echo ==========================================
if %errorlevel% equ 0 (
    echo 推送成功！
) else (
    echo 推送失败，请检查网络连接或 GitHub 凭据
)
echo ==========================================

pause
