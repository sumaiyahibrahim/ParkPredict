param()
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'Node.js/npm was not found. Install Node.js 20 LTS, reopen PowerShell, and run this script again.'
}

Write-Host 'Installing ParkPredict web dependencies...'
Push-Location $ProjectRoot
try {
  npm install
  $Backend = Join-Path $ProjectRoot 'backend'
  $Venv = Join-Path $Backend '.venv'
  if (-not (Test-Path $Venv)) {
    if (Get-Command py -ErrorAction SilentlyContinue) {
      py -3 -m venv $Venv
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
      python -m venv $Venv
    } else {
      throw 'Python 3 was not found. Install Python 3.11 or newer, reopen PowerShell, and run this script again.'
    }
  }
  $VenvPython = Join-Path $Venv 'Scripts\python.exe'
  & $VenvPython -m pip install --upgrade pip
  & $VenvPython -m pip install -r (Join-Path $Backend 'requirements.txt')
  if (-not (Test-Path (Join-Path $ProjectRoot '.env'))) {
    Copy-Item (Join-Path $ProjectRoot '.env.example') (Join-Path $ProjectRoot '.env')
  }
  if (-not (Test-Path (Join-Path $Backend '.env'))) {
    Copy-Item (Join-Path $Backend '.env.example') (Join-Path $Backend '.env')
  }
  Write-Host ''
  Write-Host 'Setup complete. Edit .env, backend/.env, and firmware secrets.h before Live mode.' -ForegroundColor Green
} finally {
  Pop-Location
}
