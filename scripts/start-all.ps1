# ==============================================================================
# LifeFlow AI - Service Launcher (PowerShell)
# Launches Backend, AI Service, Edge Gateway, and Frontend in separate windows.
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         LifeFlow AI - Launching All Services             " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$RootPath = (Get-Item -Path $PSScriptRoot).Parent.FullName

# 1. Start Spring Boot Core Backend (Port 8080)
Write-Host ""
Write-Host "[1/4] Starting Spring Boot Backend on port 8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.ui.RawUI.WindowTitle = 'LifeFlow AI - Backend [Port 8080]'; Set-Location '$RootPath\backend'; Write-Host 'Starting Spring Boot Backend...' -ForegroundColor Cyan; mvn spring-boot:run"

# 2. Start AI Prediction & Vision Microservice (Port 8000)
Write-Host "[2/4] Starting FastAPI AI Service on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.ui.RawUI.WindowTitle = 'LifeFlow AI - AI Service [Port 8000]'; Set-Location '$RootPath\ai-service'; Write-Host 'Starting AI Service...' -ForegroundColor Green; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# 3. Start Edge Gateway (Port 8001)
Write-Host "[3/4] Starting Edge Gateway on port 8001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.ui.RawUI.WindowTitle = 'LifeFlow AI - Edge Gateway [Port 8001]'; Set-Location '$RootPath\edge-gateway'; Write-Host 'Starting Edge Gateway...' -ForegroundColor Magenta; python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

# 4. Start React Tactical Frontend UI (Port 5173)
Write-Host "[4/4] Starting React Vite Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.ui.RawUI.WindowTitle = 'LifeFlow AI - Frontend [Port 5173]'; Set-Location '$RootPath\frontend'; Write-Host 'Starting Frontend...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  All 4 services have been launched in separate windows!   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait ~15-20 seconds for the backend to finish booting, then:"
Write-Host "  1. Open http://localhost:5173 in your browser." -ForegroundColor White
Write-Host "  2. Log in as Paramedic (Paramedic@123)." -ForegroundColor White
Write-Host "  3. Go to Simulation Control to launch the Golden Hour demo." -ForegroundColor White
Write-Host ""
