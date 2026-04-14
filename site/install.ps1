Write-Host ""
Write-Host "  GrabGPT Installer" -ForegroundColor Cyan
Write-Host "  ==================" -ForegroundColor Cyan
Write-Host ""

$nodeExists = $null
try { $nodeExists = Get-Command node -ErrorAction SilentlyContinue } catch {}

if ($nodeExists) {
    $nodeVersion = node -v
    Write-Host "  Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  Node.js not found. Installing..." -ForegroundColor Yellow

    $wingetExists = $null
    try { $wingetExists = Get-Command winget -ErrorAction SilentlyContinue } catch {}

    if ($wingetExists) {
        Write-Host "  Using winget..."
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "  Node.js installed: $(node -v)" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: winget not available." -ForegroundColor Red
        Write-Host "  Please install Node.js manually: https://nodejs.org" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "  Starting GrabGPT..." -ForegroundColor Cyan
Write-Host ""

npx grabgpt@latest
