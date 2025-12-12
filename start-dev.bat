@echo off
title Prosolo 数据提取器开发服务器
echo ========================================
echo   Prosolo 数据提取器 - 开发服务器启动器
echo ========================================
echo.

REM 检查Node.js是否安装
echo 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到 Node.js。请先安装 Node.js。
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否可用
echo 检查 npm 环境...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到 npm。请确保 Node.js 安装完整。
    pause
    exit /b 1
)

REM 检查node_modules目录是否存在
if not exist "node_modules" (
    echo 检测到首次运行，正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败。
        pause
        exit /b 1
    )
    echo 依赖安装完成。
    echo.
)

REM 启动开发服务器
echo 启动开发服务器...
echo 访问地址: http://localhost:3000
echo 按 Ctrl+C 停止服务器
echo.
npm run dev