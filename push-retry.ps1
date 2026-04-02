# 自动重试推送脚本
$retries = 0
$maxRetries = 10

Write-Host "开始推送代码到 GitHub..." -ForegroundColor Yellow

while ($retries -lt $maxRetries) {
    $retries++
    Write-Host "尝试 #$retries..." -ForegroundColor Cyan
    
    cd c:\Users\Hong\WorkBuddy\20260330235933\sketchpad-web
    $result = git push origin master 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "================================" -ForegroundColor Green
        Write-Host "推送成功！" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Railway 会自动检测到更新并重新构建" -ForegroundColor Yellow
        break
    } else {
        Write-Host "推送失败，等待 10 秒后重试..." -ForegroundColor Red
        Write-Host "错误: $result" -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
}

if ($retries -eq $maxRetries) {
    Write-Host ""
    Write-Host "已达到最大重试次数（$maxRetries），请手动检查网络" -ForegroundColor Red
}