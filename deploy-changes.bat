@echo off
title Prosolo 数据提取器 - 部署更新
echo ========================================
echo   Prosolo 数据提取器 - 部署更新脚本
echo ========================================
echo.

REM 添加所有更改到暂存区
echo 正在添加更改到暂存区...
git add .

REM 获取提交信息
set /p commit_message=请输入提交信息（直接回车使用默认信息）: 
if "%commit_message%"=="" set commit_message=Update project files

REM 提交更改
echo 正在提交更改...
git commit -m "%commit_message%"

REM 推送到远程仓库
echo 正在推送到远程仓库...
git push origin master

echo.
echo 部署完成！您的更改已成功推送到GitHub仓库。
pause