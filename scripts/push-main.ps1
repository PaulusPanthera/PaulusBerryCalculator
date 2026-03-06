param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"

npm run check

git add .
git commit -m $Message
git push origin main
