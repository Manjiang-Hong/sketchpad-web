# SketchPad Web Deployment Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SketchPad Web Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Git status
Write-Host "Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host "Found uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus
    Write-Host ""
    
    $commit = Read-Host "Commit and push? (y/n)"
    if ($commit -eq 'y') {
        Write-Host "Adding files..." -ForegroundColor Yellow
        git add .
        
        $message = Read-Host "Commit message (default: Deploy update)"
        if (-not $message) { $message = "Deploy update" }
        
        Write-Host "Committing changes..." -ForegroundColor Yellow
        git commit -m $message
        
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push
        
        Write-Host ""
        Write-Host "Code pushed to GitHub!" -ForegroundColor Green
    }
} else {
    Write-Host "Working directory clean, no commits needed." -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Checklist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Deploy Backend to Railway:" -ForegroundColor Yellow
Write-Host "   - Visit https://railway.app/" -ForegroundColor White
Write-Host "   - Login with GitHub" -ForegroundColor White
Write-Host "   - New Project -> Deploy from GitHub repo" -ForegroundColor White
Write-Host "   - Select sketchpad-web repository" -ForegroundColor White
Write-Host "   - Add environment variable:" -ForegroundColor White
Write-Host "     JWT_SECRET=your-super-secret-key-2026" -ForegroundColor Gray
Write-Host "   - Add Volume for persistence:" -ForegroundColor White
Write-Host "     Mount path: /app/server/data" -ForegroundColor Gray
Write-Host ""
Write-Host "[2] Deploy Frontend to Vercel:" -ForegroundColor Yellow
Write-Host "   - Visit https://vercel.com/" -ForegroundColor White
Write-Host "   - Login with GitHub" -ForegroundColor White
Write-Host "   - Import sketchpad-web project" -ForegroundColor White
Write-Host "   - Add environment variable:" -ForegroundColor White
Write-Host "     VITE_API_HOST=<railway-backend-url>" -ForegroundColor Gray
Write-Host "     (domain only, without https://)" -ForegroundColor Gray
Write-Host ""
Write-Host "[3] Test Accounts:" -ForegroundColor Yellow
Write-Host "   - test1 / test123" -ForegroundColor White
Write-Host "   - test2 / test123" -ForegroundColor White
Write-Host "   - test3 / test123" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "See DEPLOYMENT.md for detailed guide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan