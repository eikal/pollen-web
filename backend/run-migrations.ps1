<#
Simple helper to run SQL migration files against a Postgres database using psql.

# Environment variables expected (or pass as parameters):
# - PGHOST (default localhost)
# - PGPORT (default 5432)
# - PGDATABASE (default pollen_dev)
# - PGUSER (default postgres)
# - PGPASSWORD

Usage examples:
  # set env vars in PowerShell and run
  $env:PGHOST='localhost'; $env:PGUSER='postgres'; $env:PGDATABASE='pollen_dev'; $env:PGPASSWORD='postgres'; .\backend\run-migrations.ps1
# or pass connection string parameters to the script
.
# The script expects `psql` to be available in PATH.
#
# This script is intentionally minimal — for production use, integrate with a migration tool.
#>

param(
  [string]$MigrationsPath = ".\migrations",
  [switch]$Seed,
  [string]$PGHOSTParam,
  [string]$PGPORTParam,
  [string]$PGDATABASEParam,
  [string]$PGUSERParam,
  [string]$PGPASSWORDParam
)

function Get-EnvOrDefault {
  param(
    [string]$Name,
    [string]$Default
  )
  $val = ${env:$Name}
  if ([string]::IsNullOrEmpty($val)) { return $Default } else { return $val }
}

$pgHost = if (-not [string]::IsNullOrEmpty($PGHOSTParam)) { $PGHOSTParam } else { Get-EnvOrDefault -Name 'PGHOST' -Default 'localhost' }
$pgPort = if (-not [string]::IsNullOrEmpty($PGPORTParam)) { $PGPORTParam } else { Get-EnvOrDefault -Name 'PGPORT' -Default '5432' }
# Provide sensible defaults so running the script in the common docker-compose dev setup works without extra env vars
$pgDatabase = if (-not [string]::IsNullOrEmpty($PGDATABASEParam)) { $PGDATABASEParam } else { Get-EnvOrDefault -Name 'PGDATABASE' -Default 'pollen_dev' }
$pgUser = if (-not [string]::IsNullOrEmpty($PGUSERParam)) { $PGUSERParam } else { Get-EnvOrDefault -Name 'PGUSER' -Default 'postgres' }
$pgPassword = if (-not [string]::IsNullOrEmpty($PGPASSWORDParam)) { $PGPASSWORDParam } else { Get-EnvOrDefault -Name 'PGPASSWORD' -Default 'postgres' }

Write-Host "Using PGHOST=$pgHost PGPORT=$pgPort PGDATABASE=$pgDatabase PGUSER=$pgUser" -ForegroundColor Cyan
$files = Get-ChildItem -Path $MigrationsPath -Filter "*.sql" | Sort-Object Name
foreach ($f in $files) {
  if ($f.Name -like '002_seed*' -and -not $Seed) { continue }
  Write-Host "Applying $($f.Name)..."
  $env:PGPASSWORD = $pgPassword
  # prefer host psql if available; otherwise try running psql inside the pollen-postgres container
  $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($null -ne $psqlCmd) {
    & psql -h $pgHost -p $pgPort -U $pgUser -d $pgDatabase -f $f.FullName
    if ($LASTEXITCODE -ne 0) {
      Write-Host "psql returned exit code $LASTEXITCODE while applying $($f.Name)" -ForegroundColor Red
      exit $LASTEXITCODE
    }
  }
  else {
    Write-Host "Host 'psql' not found in PATH. Attempting to run psql inside Docker container 'pollen-postgres'..." -ForegroundColor Yellow
    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    if ($null -eq $dockerCmd) {
      Write-Host "Neither 'psql' nor 'docker' are available in PATH. Cannot run migrations." -ForegroundColor Red
      exit 2
    }

    # check container is running
    $container = (& docker ps --filter "name=pollen-postgres" --format "{{.Names}}") -join ""
    if ([string]::IsNullOrEmpty($container)) {
      Write-Host "Docker container 'pollen-postgres' not found running. Start the container and try again." -ForegroundColor Red
      exit 3
    }

    # run psql inside container; migrations were mounted into /migrations by docker-compose
    $inContainerPath = "/migrations/$($f.Name)"
    & docker exec -i $container psql -U $pgUser -d $pgDatabase -f $inContainerPath
    if ($LASTEXITCODE -ne 0) {
      Write-Host "psql (inside container) returned exit code $LASTEXITCODE while applying $($f.Name)" -ForegroundColor Red
      exit $LASTEXITCODE
    }
  }
}

Write-Host "All migrations applied." -ForegroundColor Green
