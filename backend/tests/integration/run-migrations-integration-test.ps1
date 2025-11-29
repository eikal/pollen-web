<#
Integration test: run migrations inside a temporary Postgres Docker container,
verify that the `organizations` table exists, then tear down the container.

Requirements: Docker daemon available and running, host can mount the repo path into container.

Usage (PowerShell):
  .\backend\tests\integration\run-migrations-integration-test.ps1

This script maps the local `backend/migrations` directory into the container at /migrations
and runs psql inside the container to apply the SQL files.
#>

Set-StrictMode -Version Latest

$containerName = 'pollen_migrations_test'
$mappedHostPath = (Get-Location).Path + '\backend\migrations'
$pgPort = 5433

function Cleanup {
  Write-Host "Cleaning up container (if exists)..."
  docker ps -a --filter "name=$containerName" --format "{{.ID}}" | ForEach-Object { docker rm -f $_ } > $null 2>&1
}

try {
  Cleanup

  Write-Host "Starting Postgres container '$containerName'..."
  docker run -d --rm --name $containerName -e POSTGRES_PASSWORD=postgres -p $pgPort:5432 -v "${mappedHostPath}:/migrations:ro" postgres:15 | Out-Null

  Write-Host "Waiting for Postgres to become available..."
  $max = 30
  $ready = $false
  for ($i = 0; $i -lt $max; $i++) {
    Start-Sleep -Seconds 1
    try {
      docker exec $containerName pg_isready -U postgres > $null 2>&1
      if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    } catch { }
  }
  if (-not $ready) { throw "Postgres did not become ready in time" }

  Write-Host "Applying migrations inside container..."
  docker exec $containerName psql -U postgres -d postgres -f /migrations/001_create_metadata.sql
  if ($LASTEXITCODE -ne 0) { throw "Failed applying 001_create_metadata.sql" }

  Write-Host "Applying seed data..."
  docker exec $containerName psql -U postgres -d postgres -f /migrations/002_seed_sample_data.sql
  if ($LASTEXITCODE -ne 0) { throw "Failed applying 002_seed_sample_data.sql" }

  Write-Host "Verifying 'organizations' table exists..."
  $result = docker exec $containerName psql -U postgres -d postgres -tAc "SELECT to_regclass('public.organizations');"
  $result = $result.Trim()
  if ($result -ne 'organizations') {
    throw "Verification failed: expected 'organizations' but got '$result'"
  }

  Write-Host "Integration test passed: 'organizations' table exists." -ForegroundColor Green

  # mark success by exiting 0
  exit 0
} catch {
  Write-Host "Integration test FAILED: $_" -ForegroundColor Red
  exit 2
} finally {
  Cleanup
}
