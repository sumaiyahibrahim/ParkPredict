param()
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Backend = Join-Path $ProjectRoot 'backend'
$Python = Join-Path $Backend '.venv\Scripts\python.exe'
$NeedsSetup = -not (Test-Path (Join-Path $ProjectRoot 'node_modules')) -or
              -not (Test-Path $Python) -or
              -not (Test-Path (Join-Path $ProjectRoot '.env')) -or
              -not (Test-Path (Join-Path $Backend '.env'))

if ($NeedsSetup) {
  Write-Host 'First run detected. Installing dependencies and creating local configuration...' -ForegroundColor Cyan
  & (Join-Path $PSScriptRoot 'setup-demo.ps1')
}

if (-not (Test-Path $Python)) { throw 'Backend setup did not complete. Review the setup error above.' }

$GatewayCommand = "Set-Location -LiteralPath '$ProjectRoot'; & '$Python' -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"
$WebCommand = "Set-Location -LiteralPath '$ProjectRoot'; npm run dev"
Start-Process powershell -ArgumentList '-NoExit','-Command',$GatewayCommand
Start-Process powershell -ArgumentList '-NoExit','-Command',$WebCommand
Write-Host 'ParkPredict gateway and website started in two terminals.' -ForegroundColor Green
Write-Host 'Website:        http://localhost:5173'
Write-Host 'Gateway health: http://localhost:8000/api/iot/health'
Write-Host ''
Write-Host 'For Live sensor mode, configure backend/.env and firmware secrets.h with matching device credentials.' -ForegroundColor Yellow
