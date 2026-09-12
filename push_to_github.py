#!/usr/bin/env python3
"""
推送本地代码到 GitHub 仓库
"""
import os
import subprocess
import sys

def run_command(cmd, cwd=None):
    """运行命令并返回结果"""
    print(f"执行: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result.returncode == 0

def main():
    source_dir = r"E:\easyshow"
    repo_url = "https://github.com/snowly3281-oss/easyshowtech.git"
    
    # 检查目录是否存在
    if not os.path.exists(source_dir):
        print(f"错误: 目录 {source_dir} 不存在")
        return 1
    
    os.chdir(source_dir)
    print(f"当前目录: {os.getcwd()}")
    
    # 检查是否已经是 git 仓库
    git_dir = os.path.join(source_dir, ".git")
    if not os.path.exists(git_dir):
        print("初始化 Git 仓库...")
        if not run_command("git init"):
            return 1
    else:
        print("Git 仓库已存在")
    
    # 配置用户信息
    print("配置 Git 用户信息...")
    run_command('git config user.email "snowly3281@gmail.com"')
    run_command('git config user.name "Snow Li"')
    
    # 检查远程仓库
    print("检查远程仓库...")
    result = subprocess.run("git remote -v", shell=True, capture_output=True, text=True)
    if "origin" not in result.stdout:
        print("添加远程仓库...")
        if not run_command(f'git remote add origin {repo_url}'):
            return 1
    else:
        print("更新远程仓库地址...")
        run_command(f'git remote set-url origin {repo_url}')
    
    # 检查是否有文件需要提交
    result = subprocess.run("git status --porcelain", shell=True, capture_output=True, text=True)
    if result.stdout.strip():
        print("添加文件到暂存区...")
        if not run_command("git add ."):
            return 1
        
        print("提交更改...")
        if not run_command('git commit -m "Initial commit"'):
            return 1
    else:
        print("没有需要提交的文件")
    
    # 推送到远程仓库
    print("推送到 GitHub...")
    if not run_command("git push -u origin main"):
        # 尝试 master 分支
        print("尝试推送到 master 分支...")
        if not run_command("git push -u origin master"):
            return 1
    
    print("✅ 推送成功！")
    return 0

if __name__ == "__main__":
    sys.exit(main())
