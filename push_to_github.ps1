# PowerShell 脚本：将 E:\easyshow 推送到 GitHub
# 仓库地址: https://github.com/snowly3281-oss/easyshowtech.git

$repoUrl = "https://github.com/snowly3281-oss/easyshowtech.git"
$localPath = "E:\easyshow"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  推送代码到 GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否安装
try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Git not found"
    }
    Write-Host "✓ Git 已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git 未安装或未在 PATH 中" -ForegroundColor Red
    Write-Host "请安装 Git: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# 进入项目目录
Set-Location $localPath
Write-Host "✓ 进入目录: $localPath" -ForegroundColor Green

# 检查是否已经是 Git 仓库
if (Test-Path ".git") {
    Write-Host "✓ 已经是 Git 仓库" -ForegroundColor Green
} else {
    Write-Host "→ 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git 仓库初始化完成" -ForegroundColor Green
}

# 添加所有文件
Write-Host "→ 添加文件到暂存区..." -ForegroundColor Yellow
git add .
Write-Host "✓ 文件已添加" -ForegroundColor Green

# 检查是否有文件要提交
$status = git status --porcelain
if ($status) {
    Write-Host "→ 提交更改..." -ForegroundColor Yellow
    git commit -m "Initial commit: EasyShow project"
    Write-Host "✓ 提交完成" -ForegroundColor Green
} else {
    Write-Host "✓ 没有需要提交的更改" -ForegroundColor Green
}

# 设置远程仓库
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 远程仓库已存在，更新 URL..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
} else {
    Write-Host "→ 添加远程仓库..." -ForegroundColor Yellow
    git remote add origin $repoUrl
}
Write-Host "✓ 远程仓库设置完成: $repoUrl" -ForegroundColor Green

# 推送到 GitHub
Write-Host "→ 推送到 GitHub..." -ForegroundColor Yellow
Write-Host "  (可能需要输入 GitHub 用户名和密码/令牌)" -ForegroundColor Cyan

try {
    git push -u origin main 2>$null
    if ($LASTEXITCODE -ne 0) {
        # 尝试 master 分支
        git push -u origin master
    }
    Write-Host "✓ 推送成功！" -ForegroundColor Green
} catch {
    Write-Host "✗ 推送失败" -ForegroundColor Red
    Write-Host "  请检查:"
    Write-Host "  1. GitHub 仓库是否存在且可访问"
    Write-Host "  2. 是否有推送权限"
    Write-Host "  3. 网络连接是否正常"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  完成！代码已推送到 GitHub" -ForegroundColor Cyan
Write-Host "  仓库地址: $repoUrl" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
