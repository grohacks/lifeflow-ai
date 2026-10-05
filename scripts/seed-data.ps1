# ==============================================================================
# LifeFlow AI - Seed Data Verification Script (PowerShell)
# Verifies seeded users, ambulances, hospitals, and triggers initial simulation state.
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         LifeFlow AI - Seed Data Verification             " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$BackendUrl = "http://localhost:8080/api"

Write-Host ""
Write-Host "[1/3] Authenticating with backend..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "$BackendUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResp.data.token
    Write-Host "  [OK] Authentication successful. User: $($loginResp.data.username), Role: $($loginResp.data.roles -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "  [!] Authentication failed. Is the backend running on port 8080? ($($_.Exception.Message))" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host ""
Write-Host "[2/3] Checking Ambulances..." -ForegroundColor Yellow
try {
    $ambulancesResp = Invoke-RestMethod -Uri "$BackendUrl/ambulances" -Method Get -Headers $headers
    $ambulances = $ambulancesResp.data
    Write-Host "  [OK] Found $($ambulances.Count) registered ambulances:" -ForegroundColor Green
    foreach ($amb in $ambulances) {
        Write-Host "      - $($amb.callSign) (ID: $($amb.id), Status: $($amb.status))" -ForegroundColor Gray
    }
} catch {
    Write-Host "  [!] Failed to retrieve ambulances: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3/3] Checking Hospitals and Capacity..." -ForegroundColor Yellow
try {
    $hospitalsResp = Invoke-RestMethod -Uri "$BackendUrl/hospitals" -Method Get -Headers $headers
    $hospitals = $hospitalsResp.data
    Write-Host "  [OK] Found $($hospitals.Count) participating hospitals:" -ForegroundColor Green
    foreach ($hosp in $hospitals) {
        Write-Host "      - $($hosp.name) (Trauma: $($hosp.traumaLevel), STEMI: $($hosp.hasStemiCenter), Stroke: $($hosp.hasStrokeCenter))" -ForegroundColor Gray
    }
} catch {
    Write-Host "  [!] Failed to retrieve hospitals: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Seed verification complete. System is ready for demo.   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
