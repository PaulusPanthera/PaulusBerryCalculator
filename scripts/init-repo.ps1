param(
    [string]$RemoteUrl = "https://github.com/PaulusPanthera/PaulusBerryCalculator.git"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

$hasOrigin = git remote 2>$null | Select-String -SimpleMatch "origin"
if ($hasOrigin) {
    git remote set-url origin $RemoteUrl
} else {
    git remote add origin $RemoteUrl
}

Write-Host "Repository initialized for $RemoteUrl" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  git add ."
Write-Host "  git commit -m 'chore: initial project setup'"
Write-Host "  git push -u origin main"
