# Prosolo 数据提取器开发服务器启动脚本
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Prosolo 数据提取器 - 开发服务器启动器" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 检查Node.js是否安装
Write-Host "检查 Node.js 环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未检测到 Node.js。请先安装 Node.js。" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Cyan
    pause
    exit 1
}

# 检查npm是否可用
Write-Host "检查 npm 环境..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未检测到 npm。请确保 Node.js 安装完整。" -ForegroundColor Red
    pause
    exit 1
}

# 检查node_modules目录是否存在
if (!(Test-Path "node_modules")) {
    Write-Host "检测到首次运行，正在安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: 依赖安装失败。" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "依赖安装完成。" -ForegroundColor Green
    Write-Host ""
}

# 启动开发服务器
Write-Host "启动开发服务器..." -ForegroundColor Yellow
Write-Host "访问地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Cyan
Write-Host ""
npm run dev