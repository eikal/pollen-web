# create-issues.ps1
# Creates GitHub issues from markdown files under specs/001-simple-website-which/issues/
# Run from the repository root. Requires gh CLI and that you've run `gh auth login`.

$issuesDir = Join-Path -Path (Get-Location) -ChildPath "specs\001-simple-website-which\issues"
if (-not (Test-Path $issuesDir)) {
  Write-Error "Issues directory not found: $issuesDir"
  exit 1
}

$mdFiles = Get-ChildItem -Path $issuesDir -Filter '*.md' | Sort-Object Name
if ($mdFiles.Count -eq 0) {
  Write-Output "No markdown files found in $issuesDir"
  exit 0
}

# Set $dryRun to $true to only print commands instead of creating issues
$dryRun = $false

foreach ($f in $mdFiles) {
  $firstLines = Get-Content -Path $f.FullName -TotalCount 10
  $titleLine = $firstLines | Where-Object { $_ -match '^\s*#\s+' } | Select-Object -First 1
  if (-not $titleLine) {
    Write-Warning "Skipping $($f.Name): no heading found; using first line as title"
    $title = (Get-Content -Path $f.FullName -TotalCount 1).Trim()
  } else {
    $title = ($titleLine -replace '^\s*#\s*','').Trim()
  }

  # Adjust labels as needed
  $labels = @('spec','backend')
  $labelsArg = $labels -join ','

  Write-Output "Preparing issue: $title (from $($f.Name))"

  $cmd = "gh issue create --title \"{0}\" --body-file \"{1}\" --label ""{2}""" -f $title, $f.FullName, $labelsArg

  if ($dryRun) {
    Write-Output "[dry-run] $cmd"
  } else {
    & gh issue create --title $title --body-file $f.FullName --label $labelsArg
    if ($LASTEXITCODE -ne 0) {
      Write-Error "Failed to create issue from $($f.Name). gh exit code: $LASTEXITCODE"
    } else {
      Write-Output "Created issue for $($f.Name)"
    }
  }

  Start-Sleep -Seconds 1
}