@echo off
chcp 65001 >nul
echo =============================================
echo   EasyShowTech 部署脚本
echo =============================================
echo.

echo [步骤 1/4] 检查 Git 状态...
cd /d E:\easyshow
git status
echo.

echo [步骤 2/4] 提交配置更改到 Git...
git add .
git commit -m "Update project config for easyshowtech deployment"
git push origin main
echo.

echo [步骤 3/4] 部署 Sanity Studio...
cd /d E:\easyshow\studio
call npm run deploy
echo.

echo [步骤 4/4] 部署到 Cloudflare...
cd /d E:\easyshow
call npm run deploy
echo.

echo =============================================
echo   部署完成!
echo =============================================
echo.
echo 访问地址:
echo   - 主站: https://easyshowtech.com
echo   - Sanity Studio: https://easyshowtech.sanity.studio
echo.
pause
