# SketchPad Web 启动脚本

Write-Host "🚀 SketchPad Web 版启动中..." -ForegroundColor Cyan

# 检查 node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    npm install
}

# 检查 .env 文件
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "⚠️  未找到 .env 文件！" -ForegroundColor Red
    Write-Host "请复制 .env.example 为 .env 并填写腾讯云 API 密钥" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "获取密钥：https://console.cloud.tencent.com/cam/capi" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "✅ 环境检查通过" -ForegroundColor Green
Write-Host ""
Write-Host "📝 启动服务：" -ForegroundColor Cyan
Write-Host "   前端：http://localhost:5173" -ForegroundColor White
Write-Host "   后端：http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

# 启动前后端
npm run dev:all