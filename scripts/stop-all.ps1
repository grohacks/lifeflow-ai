# ==============================================================================
# LifeFlow AI - Service Shutdown Script (PowerShell)
# Gracefully terminates the running dev servers by port numbers.
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         LifeFlow AI - Stopping Services                  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ports = @(8080, 8000, 8001, 5173)

foreach ($port in $ports) {
    try {
        $netstatOutput = netstat -ano | Select-String ":$port\s"
        if ($netstatOutput) {
            foreach ($line in $netstatOutput) {
                $tokens = $line.ToString().Trim() -split '\s+'
                $pidValue = $tokens[-1]
                if ($pidValue -match '^\d+$' -and $pidValue -ne '0') {
                    Write-Host "Stopping process on port $port (PID: $pidValue)..." -ForegroundColor Yellow
                    Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
                }
            }
        } else {
            Write-Host "Port $port is already free." -ForegroundColor Gray
        }
    } catch {
        Write-Host "Could not inspect port $port" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Services stopped." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
