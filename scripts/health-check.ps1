# ==============================================================================
# LifeFlow AI - Health Check Script (PowerShell)
# Tests infrastructure ports and microservice HTTP health endpoints.
# ==============================================================================

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         LifeFlow AI - System Health Inspection           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

function Test-Port {
    param (
        [string]$HostName,
        [int]$Port,
        [string]$ServiceName
    )
    $tcp = New-Object System.Net.Sockets.TcpClient
    $result = $tcp.BeginConnect($HostName, $Port, $null, $null)
    $success = $result.AsyncWaitHandle.WaitOne(1000, $false)
    if ($success -and $tcp.Connected) {
        $tcp.EndConnect($result)
        $tcp.Close()
        [PSCustomObject]@{
            Service = $ServiceName
            Target  = "$HostName`:$Port"
            Type    = "TCP Port"
            Status  = "UP"
            Details = "Port is open and accepting connections"
        }
    } else {
        $tcp.Close()
        [PSCustomObject]@{
            Service = $ServiceName
            Target  = "$HostName`:$Port"
            Type    = "TCP Port"
            Status  = "DOWN"
            Details = "Port is unreachable"
        }
    }
}

function Test-Http {
    param (
        [string]$Url,
        [string]$ServiceName
    )
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 3 -ErrorAction Stop
        $status = if ($response.status) { $response.status } else { "UP" }
        [PSCustomObject]@{
            Service = $ServiceName
            Target  = $Url
            Type    = "HTTP GET"
            Status  = $status
            Details = "Endpoint responded successfully"
        }
    } catch {
        [PSCustomObject]@{
            Service = $ServiceName
            Target  = $Url
            Type    = "HTTP GET"
            Status  = "DOWN"
            Details = $_.Exception.Message
        }
    }
}

$results = @()

Write-Host "Inspecting Infrastructure Services..." -ForegroundColor Yellow
$results += Test-Port -HostName "127.0.0.1" -Port 3306 -ServiceName "MySQL Database"
$results += Test-Port -HostName "127.0.0.1" -Port 6379 -ServiceName "Redis Cache"
$results += Test-Port -HostName "127.0.0.1" -Port 1883 -ServiceName "Mosquitto MQTT"

Write-Host "Inspecting Application Microservices..." -ForegroundColor Yellow
$results += Test-Http -Url "http://localhost:8080/api/health" -ServiceName "Spring Boot Backend"
$results += Test-Http -Url "http://localhost:8000/health"     -ServiceName "FastAPI AI Service"
$results += Test-Http -Url "http://localhost:8001/health"     -ServiceName "FastAPI Edge Gateway"
$results += Test-Http -Url "http://localhost:5173"            -ServiceName "React Vite Frontend (Dev)"

Write-Host ""
Write-Host "Health Check Results Summary:" -ForegroundColor White
Write-Host ""

foreach ($r in $results) {
    $color = if ($r.Status -eq "UP") { "Green" } else { "Red" }
    $icon = if ($r.Status -eq "UP") { "[PASS]" } else { "[FAIL]" }
    Write-Host ("{0,-7} {1,-28} {2,-32} {3,-8}" -f $icon, $r.Service, $r.Target, $r.Status) -ForegroundColor $color
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
