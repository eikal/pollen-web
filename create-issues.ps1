# create-issues.ps1
# Creates GitHub issues from markdown files under specs/001-simple-website-which/issues/
# Run from the repository root. Requires gh CLI and that you've run `gh auth login`.

param(
  # Issue prefixes to publish (e.g. T007). Default publishes T007..T012 as requested.
  [string[]]$Only = @('T007','T008','T009','T010','T011','T012'),
  [switch]$DryRun
)

$issuesDir = Join-Path -Path (Get-Location) -ChildPath "specs\001-simple-website-which\issues"
if (-not (Test-Path $issuesDir)) {
  Write-Error "Issues directory not found: $issuesDir"
  exit 1
}

$mdFiles = Get-ChildItem -Path $issuesDir -Filter '*.md' | Sort-Object Name
if ($Only -and $Only.Count -gt 0) {
  $mdFiles = $mdFiles | Where-Object {
    $prefix = ($_.BaseName -split '-')[0]
    $Only -contains $prefix
  }
}
if ($mdFiles.Count -eq 0) {
  Write-Output "No markdown files found in $issuesDir"
  exit 0
}

# Set $dryRun from parameter (or override below)
$dryRun = $DryRun.IsPresent

# Label defaults and colors (adjust as desired)
# Default labels and colors
$labels = @('spec','backend')
$labelColors = @{
  spec = '0e8a16'
  backend = '006b75'
  frontend = 'd4c5f9'
  auth = '0052cc'
  db = '5319e7'
  etl = '0e8a16'
  security = 'b60205'
  vault = '5319e7'
  billing = 'fbca04'
  docs = '0366d6'
}

# Map issue prefix -> labels to apply
$issueLabelMap = @{
  'T007' = @('spec','frontend')
  'T008' = @('spec','frontend','auth')
  'T009' = @('spec','backend','etl')
  'T010' = @('spec','backend','security','vault')
  'T011' = @('spec','backend','billing')
  'T012' = @('spec','docs')
}

# Ensure labels exist in the repo (create them if missing)
function EnsureLabelExists([string]$name) {
  # Check existence
  $viewOut = & gh label view $name 2>&1
  if ($LASTEXITCODE -eq 0) { return $true }


  # Not found — create unless dry run
  $color = $labelColors[$name]
  if (-not $color) { $color = '0e8a16' }

  if ($dryRun) {
    Write-Output "[dry-run] gh label create $name --color $color --description 'Auto-created label'"
    return $false
  }

  Write-Output "Creating label '$name' with color #$color"
  # Retry a few times on transient failures
  $maxAttempts = 3
  $attempt = 0
  $created = $false
  while (-not $created -and $attempt -lt $maxAttempts) {
    $attempt++
  $out = & gh label create $name --color $color --description 'Auto-created label by script' 2>&1
  if ($LASTEXITCODE -eq 0) { $created = $true; break }
  Write-Warning "Attempt ${attempt}: Failed to create label $name (gh exit $LASTEXITCODE)"
    Write-Output $out
    Start-Sleep -Seconds (2 * $attempt)
  }
  if (-not $created) {
    Write-Warning "Failed to create label $name after $maxAttempts attempts. Last output:"
    Write-Output $out
    Write-Output "Common causes: insufficient permissions, not authenticated, or repository not found."
    Write-Output "Suggested checks: `gh auth status`, `gh repo view`, and `gh label list` to see current labels and auth state."
    return $false
  }
  return $true
}

# Pre-create the labels we intend to use (include mappings)
$allLabels = @()
$allLabels += $labels
foreach ($k in $issueLabelMap.Keys) { $allLabels += $issueLabelMap[$k] }
$allLabels = $allLabels | ForEach-Object { $_ } | Sort-Object -Unique
foreach ($lbl in $allLabels) {
  EnsureLabelExists $lbl | Out-Null
}

foreach ($f in $mdFiles) {
  $firstLines = Get-Content -Path $f.FullName -TotalCount 10
  $titleLine = $firstLines | Where-Object { $_ -match '^\s*#\s+' } | Select-Object -First 1
  if (-not $titleLine) {
    Write-Warning "Skipping $($f.Name): no heading found; using first line as title"
    $title = (Get-Content -Path $f.FullName -TotalCount 1).Trim()
  } else {
    $title = ($titleLine -replace '^\s*#\s*','').Trim()
  }

  # determine labels for this file based on prefix mapping
  $prefix = ($f.BaseName -split '-')[0]
  $labelsForFile = $issueLabelMap[$prefix]
  if (-not $labelsForFile) { $labelsForFile = $labels }
  $labelsArg = $labelsForFile -join ','

  Write-Output "Preparing issue: $title (from $($f.Name))"

  $cmd = "gh issue create --title '$title' --body-file '$($f.FullName)' --label '$labelsArg'"

  if ($dryRun) {
    Write-Output "[dry-run] $cmd"
  } else {
    try {
      Write-Output "Creating with labels: $labelsArg"
      # Try creating with labels; if labels don't exist GH will error
      & gh issue create --title $title --body-file $f.FullName --label $labelsArg -w 2>&1 | Write-Output
      if ($LASTEXITCODE -ne 0) { throw "gh failed with exit code $LASTEXITCODE" }
      Write-Output "Created issue for $($f.Name)"
    } catch {
      Write-Warning "Primary create failed: $($_.Exception.Message) -- retrying without labels"
      # Retry without labels
      & gh issue create --title $title --body-file $f.FullName -w 2>&1 | Write-Output
      if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create issue from $($f.Name) on retry. gh exit code: $LASTEXITCODE"
      } else {
        Write-Output "Created issue for $($f.Name) (without labels)"
      }
    }
  }

  Start-Sleep -Seconds 1
}