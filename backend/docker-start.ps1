<#
backend/docker-start.ps1

Helper to start local Postgres via docker-compose, wait for healthy state,
run SQL migrations (optionally including seed), and optionally start the auth server.

Usage:
  # start db, run migrations (including seed), and start auth server
  .\docker-start.ps1 -Seed -StartAuth

Notes:
- This script runs docker-compose in the backend folder. It requires Docker Desktop or another docker engine.
- Environment variables for Postgres are set for the duration of this script so migrations and auth server
  are run against the started container.
#>

param(
  [switch]$Seed,
  [switch]$StartAuth,
  [int]$TimeoutSeconds = 120
)

Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

function ExitWithError($msg) {
  Write-Error $msg
  exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  ExitWithError "Docker CLI not found in PATH. Please install Docker Desktop and ensure 'docker' is available."
}

Write-Host "Starting Postgres via docker-compose..."
docker-compose up -d db
if ($LASTEXITCODE -ne 0) { ExitWithError 'docker-compose up failed' }

$containerName = 'pollen-postgres'

Write-Host "Waiting up to $TimeoutSeconds seconds for Postgres container to become healthy..."
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while ((Get-Date) -lt $deadline) {
  try {
    $status = docker inspect --format '{{.State.Health.Status}}' $containerName 2>$null
    if ($status -eq 'healthy') { Write-Host 'Postgres is healthy'; break }
    Write-Host "Current status: $status" -NoNewline
  } catch {
    Write-Host " (container not yet ready)" -NoNewline
  }
  Start-Sleep -Seconds 2
}

if ((Get-Date) -ge $deadline) {
  Write-Warning "Timed out waiting for Postgres to become healthy. Proceeding, but migrations may fail."
}

# Export env vars for the commands run in this script
$env:PGHOST = 'localhost'
$env:PGPORT = '5432'
$env:PGDATABASE = 'pollen_dev'
$env:PGUSER = 'postgres'
$env:PGPASSWORD = 'postgres'

Write-Host "Running migrations (seed: $Seed)"
if ($Seed) {
  $psCmd = "`$env:PGHOST='$($env:PGHOST)'; `$env:PGPORT='$($env:PGPORT)'; `$env:PGDATABASE='$($env:PGDATABASE)'; `$env:PGUSER='$($env:PGUSER)'; `$env:PGPASSWORD='$($env:PGPASSWORD)'; & '$scriptDir\\run-migrations.ps1' -Seed"
} else {
  $psCmd = "`$env:PGHOST='$($env:PGHOST)'; `$env:PGPORT='$($env:PGPORT)'; `$env:PGDATABASE='$($env:PGDATABASE)'; `$env:PGUSER='$($env:PGUSER)'; `$env:PGPASSWORD='$($env:PGPASSWORD)'; & '$scriptDir\\run-migrations.ps1'"
}

Write-Host "Invoking migrations script with explicit connection parameters..."
if ($Seed) {
  & .\run-migrations.ps1 -Seed -PGHOSTParam $env:PGHOST -PGPORTParam $env:PGPORT -PGDATABASEParam $env:PGDATABASE -PGUSERParam $env:PGUSER -PGPASSWORDParam $env:PGPASSWORD
} else {
  & .\run-migrations.ps1 -PGHOSTParam $env:PGHOST -PGPORTParam $env:PGPORT -PGDATABASEParam $env:PGDATABASE -PGUSERParam $env:PGUSER -PGPASSWORDParam $env:PGPASSWORD
}
if ($LASTEXITCODE -ne 0) { ExitWithError 'Migrations failed' }

if ($StartAuth) {
  Write-Host 'Starting auth server in background (node auth-server.js)...'
  # Start auth server as a background process
  $proc = Start-Process -FilePath node -ArgumentList 'auth-server.js' -WorkingDirectory $scriptDir -PassThru
  Write-Host "Auth server started with PID $($proc.Id)"
}

Write-Host 'Done.'
