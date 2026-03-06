param(
    [Parameter(Mandatory = $true)]
    [string]$Version,

    [Parameter(Mandatory = $true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"

$tag = "v$Version"
$commitMessage = "release: $tag - $Message"

npm run check

git add .
git commit -m $commitMessage
git tag -a $tag -m $commitMessage
git push origin main
git push origin $tag

Write-Host "Tagged and pushed $tag" -ForegroundColor Green
