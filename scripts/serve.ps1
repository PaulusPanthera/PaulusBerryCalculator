param(
    [int]$Port = 4173
)

$ErrorActionPreference = "Stop"

Write-Host "Starting local static server on http://localhost:$Port" -ForegroundColor Cyan

if (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server $Port
    exit 0
}

if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server $Port
    exit 0
}

Write-Error "Python was not found. Install Python or run a different local static server."
