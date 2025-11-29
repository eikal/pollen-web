#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start all Pollen development servers (backend API, worker, and frontend)

.DESCRIPTION
    Launches backend API server, worker, and Next.js frontend in parallel.
    Press Ctrl+C to stop all processes.

.EXAMPLE
    .\start-dev.ps1
#>

# Function to kill processes on a port
function Stop-ProcessOnPort {
    param([int]$Port)
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
               Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Write-Host "[CLEANUP] Killed process on port $Port" -ForegroundColor Yellow
    }
}

Write-Host "[POLLEN] Starting development servers..." -ForegroundColor Cyan

# Clean up any orphaned processes from previous runs
Write-Host "`n[CLEANUP] Checking for orphaned processes..." -ForegroundColor Yellow
Stop-ProcessOnPort -Port 4000  # Backend API
Stop-ProcessOnPort -Port 3000  # Frontend

# Check if Docker containers are running
Write-Host "`n[CHECK] Checking Docker containers..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=pollen-postgres" --filter "status=running" -q
$redisRunning = docker ps --filter "name=pollen-redis" --filter "status=running" -q

if (-not $postgresRunning -or -not $redisRunning) {
    Write-Host "[DOCKER] Containers not running. Starting them now..." -ForegroundColor Yellow
    Push-Location backend
    docker-compose up -d
    Pop-Location
    Write-Host "[DOCKER] Containers started" -ForegroundColor Green
    Start-Sleep -Seconds 3
} else {
    Write-Host "[DOCKER] Containers already running" -ForegroundColor Green
}

# Start backend API server
Write-Host "`n[START] Backend API server (port 4000)..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location D:\pollen-web\backend
    npm run dev
}

# Start backend worker
Write-Host "[START] Backend worker..." -ForegroundColor Cyan
$workerJob = Start-Job -ScriptBlock {
    Set-Location D:\pollen-web\backend
    npm run dev:worker
}

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend
Write-Host "[START] Frontend (port 3000)..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location D:\pollen-web\frontend
    npm run dev
}

Write-Host "`n[READY] All servers started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Gray
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "Backend:   http://localhost:4000" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray
Write-Host "`n[INFO] View logs in separate terminals or check backend/frontend folders" -ForegroundColor Yellow
Write-Host "[INFO] Press Ctrl+C to stop all servers`n" -ForegroundColor Yellow

# Keep script running and monitor job health
try {
    while ($true) {
        # Check if any job has failed
        if ($backendJob.State -eq 'Failed') {
            Write-Host "`n[ERROR] Backend API server failed!" -ForegroundColor Red
            Receive-Job -Job $backendJob
            break
        }
        if ($workerJob.State -eq 'Failed') {
            Write-Host "`n[ERROR] Worker failed!" -ForegroundColor Red
            Receive-Job -Job $workerJob
            break
        }
        if ($frontendJob.State -eq 'Failed') {
            Write-Host "`n[ERROR] Frontend failed!" -ForegroundColor Red
            Receive-Job -Job $frontendJob
            break
        }

        # Check if all jobs are still running
        $allRunning = ($backendJob.State -eq 'Running') -and 
                      ($workerJob.State -eq 'Running') -and 
                      ($frontendJob.State -eq 'Running')
        
        if (-not $allRunning) {
            Write-Host "`n[WARNING] One or more servers stopped unexpectedly" -ForegroundColor Yellow
            break
        }

        Start-Sleep -Seconds 2
    }
} finally {
    # Cleanup: stop all jobs when script exits
    Write-Host "`n[STOP] Stopping all servers..." -ForegroundColor Yellow
    
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $workerJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $workerJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    
    # Kill Node.js processes on the ports
    Stop-ProcessOnPort -Port 4000
    Stop-ProcessOnPort -Port 3000
    
    # Also kill any remaining Node.js worker processes
    Get-Process -Name node -ErrorAction SilentlyContinue | 
        Where-Object { $_.CommandLine -like "*worker.js*" } | 
        Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "[STOP] All servers stopped" -ForegroundColor Green
}
