# ==============================================================================
# LifeFlow AI - Golden Hour Demo Launcher (PowerShell)
# Starts and orchestrates the deterministic emergency demo scenario.
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       LifeFlow AI - Golden Hour Simulation Demo          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$BackendUrl = "http://localhost:8080/api"

# 1. Authenticate as paramedic or admin
Write-Host ""
Write-Host "[1/3] Authenticating session..." -ForegroundColor Yellow
$loginBody = @{
    username = "paramedic"
    password = "Paramedic@123"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "$BackendUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResp.data.token
    Write-Host "  [OK] Logged in as: $($loginResp.data.username) ($($loginResp.data.roles -join ', '))" -ForegroundColor Green
} catch {
    Write-Host "  [!] Authentication failed. Ensure backend is running. ($($_.Exception.Message))" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# 2. Trigger Simulation
Write-Host ""
Write-Host "[2/3] Triggering Golden Hour Simulation..." -ForegroundColor Yellow
try {
    $simResp = Invoke-RestMethod -Uri "$BackendUrl/simulation/start?ambulanceId=1&caseId=1" -Method Post -Headers $headers
    Write-Host "  [OK] $($simResp.message)" -ForegroundColor Green
    Write-Host "  [OK] Initial Recommendation Version: $($simResp.data.recommendation.versionNumber)" -ForegroundColor Cyan
    Write-Host "  [OK] Top Recommended Hospital: $($simResp.data.recommendation.topDestinationName)" -ForegroundColor Cyan
} catch {
    Write-Host "  [!] Simulation trigger failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Interactive or Automated Demonstration Options
Write-Host ""
Write-Host "[3/3] Demo Options:" -ForegroundColor Yellow
Write-Host "  - Open Frontend Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "  - Open Simulator Runner: python simulator/runner.py" -ForegroundColor White
Write-Host ""
Write-Host "You can inject real-time dynamic events using the following commands:"
Write-Host "  Deterioration:   Invoke-RestMethod -Uri '$BackendUrl/simulation/trigger-deterioration?caseId=1' -Method Post -Headers `$headers" -ForegroundColor Gray
Write-Host "  Traffic Surge:   Invoke-RestMethod -Uri '$BackendUrl/simulation/trigger-traffic-surge?ambulanceId=1' -Method Post -Headers `$headers" -ForegroundColor Gray
Write-Host "  Hospital Drop:   Invoke-RestMethod -Uri '$BackendUrl/simulation/trigger-hospital-drop?hospitalId=2' -Method Post -Headers `$headers" -ForegroundColor Gray

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Demo is active! Check frontend at http://localhost:5173  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
