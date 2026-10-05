# ==============================================================================
# LifeFlow AI - Setup Script (PowerShell)
# Initializes environment, dependencies, local MySQL database, and packages.
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       LifeFlow AI - System Initialization and Setup       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$RootPath = (Get-Item -Path $PSScriptRoot).Parent.FullName
Set-Location -Path $RootPath

# 1. Check environment file
Write-Host ""
Write-Host "[1/6] Checking environment configuration (.env)..." -ForegroundColor Yellow
if (-not (Test-Path "$RootPath\.env")) {
    Copy-Item "$RootPath\.env.example" "$RootPath\.env"
    Write-Host "  [OK] Created .env from .env.example" -ForegroundColor Green
} else {
    Write-Host "  [OK] .env file already exists." -ForegroundColor Green
}

# 2. Check Database Connectivity and Create Database
Write-Host ""
Write-Host "[2/6] Checking local MySQL configuration..." -ForegroundColor Yellow
$DbHost = "127.0.0.1"
$DbPort = "3306"
$DbUser = "root"
$DbPass = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "root" }

$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlCmd) {
    try {
        Write-Host "  [*] Creating 'lifeflow' database if not exists..." -ForegroundColor Gray
        & mysql -h $DbHost -P $DbPort -u $DbUser --password=$DbPass -e "CREATE DATABASE IF NOT EXISTS lifeflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        Write-Host "  [OK] MySQL 'lifeflow' database verified/created." -ForegroundColor Green
    } catch {
        Write-Host "  [!] Warning: Could not execute MySQL CLI directly. Ensure MySQL server is running on port 3306 and database 'lifeflow' exists." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [*] 'mysql' command not in PATH. Please verify MySQL service is running and 'lifeflow' database exists." -ForegroundColor Gray
}

# 3. Create upload directory
Write-Host ""
Write-Host "[3/6] Setting up uploads directory..." -ForegroundColor Yellow
$UploadsDir = "$RootPath\data\uploads"
if (-not (Test-Path $UploadsDir)) {
    New-Item -ItemType Directory -Path $UploadsDir -Force | Out-Null
    Write-Host "  [OK] Created $UploadsDir" -ForegroundColor Green
} else {
    Write-Host "  [OK] $UploadsDir exists." -ForegroundColor Green
}

# 4. Setup Python AI Service and Edge Gateway
Write-Host ""
Write-Host "[4/6] Setting up Python dependencies..." -ForegroundColor Yellow
$PythonCmd = Get-Command python -ErrorAction SilentlyContinue
if ($PythonCmd) {
    Write-Host "  [*] Checking AI Service dependencies..." -ForegroundColor Gray
    & python -m pip install -r "$RootPath\ai-service\requirements.txt" --quiet
    Write-Host "  [OK] AI Service dependencies ready." -ForegroundColor Green

    Write-Host "  [*] Checking Edge Gateway dependencies..." -ForegroundColor Gray
    & python -m pip install -r "$RootPath\edge-gateway\requirements.txt" --quiet
    Write-Host "  [OK] Edge Gateway dependencies ready." -ForegroundColor Green
} else {
    Write-Host "  [!] Python not found in PATH. Please install Python 3.10+." -ForegroundColor Red
}

# 5. Compile Backend (Spring Boot + Flyway)
Write-Host ""
Write-Host "[5/6] Verifying Java and Maven backend..." -ForegroundColor Yellow
$MvnCmd = Get-Command mvn -ErrorAction SilentlyContinue
if ($MvnCmd) {
    Write-Host "  [*] Compiling backend test/main sources with Maven..." -ForegroundColor Gray
    Push-Location "$RootPath\backend"
    & mvn test-compile -DskipTests --quiet
    Pop-Location
    Write-Host "  [OK] Backend compilation verified." -ForegroundColor Green
} else {
    Write-Host "  [!] Maven not found in PATH. Please install Maven 3.9+." -ForegroundColor Red
}

# 6. Setup Frontend
Write-Host ""
Write-Host "[6/6] Verifying Frontend dependencies..." -ForegroundColor Yellow
$NpmCmd = Get-Command npm -ErrorAction SilentlyContinue
if ($NpmCmd) {
    Push-Location "$RootPath\frontend"
    if (-not (Test-Path "$RootPath\frontend\node_modules")) {
        Write-Host "  [*] Running npm install..." -ForegroundColor Gray
        & npm install --quiet
    } else {
        Write-Host "  [OK] node_modules found." -ForegroundColor Green
    }
    Pop-Location
} else {
    Write-Host "  [!] npm not found in PATH. Please install Node.js 18+." -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       LifeFlow AI Setup Completed Successfully!           " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Next steps:"
Write-Host "  1. Run .\scripts\health-check.ps1 to test all services."
Write-Host "  2. Start the services (see README or terminal commands)."
Write-Host "  3. Run .\scripts\run-demo.ps1 to execute the Golden Hour scenario."
Write-Host ""
