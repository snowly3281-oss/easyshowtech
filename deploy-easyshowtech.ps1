# EasyShowTech 部署脚本
# 部署到 Cloudflare 和 Sanity Studio

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  EasyShowTech 部署脚本" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否有未提交的更改
Write-Host "步骤 1: 检查 Git 状态..." -ForegroundColor Yellow
cd E:\easyshow
git status
Write-Host ""

# 提交更改
Write-Host "步骤 2: 提交配置更改到 Git..." -ForegroundColor Yellow
git add .
git commit -m "Update project config for easyshowtech deployment"
git push origin main
Write-Host ""

# 部署 Sanity Studio
Write-Host "步骤 3: 部署 Sanity Studio..." -ForegroundColor Green
cd E:\easyshow\studio
npm run deploy
Write-Host ""

# 部署 Cloudflare
Write-Host "步骤 4: 部署到 Cloudflare..." -ForegroundColor Green
cd E:\easyshow
npm run deploy
Write-Host ""

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  部署完成!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Yellow
Write-Host "  - 主站: https://easyshowtech.com" -ForegroundColor White
Write-Host "  - Sanity Studio: https://easyshowtech.sanity.studio" -ForegroundColor White
Write-Host ""
Read-Host "按 Enter 键退出"
