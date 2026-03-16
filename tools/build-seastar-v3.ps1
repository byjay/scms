Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$sourceDir = Join-Path $rootDir 'assets\src-js'
$bundlePath = Join-Path $rootDir 'assets\seastar-v3.js'

if (-not (Test-Path $sourceDir)) {
  throw "Source directory not found: $sourceDir"
}

$parts = Get-ChildItem -Path $sourceDir -Filter '*.js' -File |
  Sort-Object Name

if (-not $parts) {
  throw "No source fragments found in $sourceDir"
}

$bundleParts = New-Object System.Collections.Generic.List[string]
$bundleParts.Add('// Built from assets/src-js. Edit the split sources, not this bundle.')
$bundleParts.Add('')

foreach ($part in $parts) {
  $bundleParts.Add("// --- BEGIN $($part.Name) ---")
  $bundleParts.Add((Get-Content -Path $part.FullName -Raw))
  $bundleParts.Add("// --- END $($part.Name) ---")
  $bundleParts.Add('')
}

$bundleText = ($bundleParts -join [Environment]::NewLine).TrimEnd() + [Environment]::NewLine
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($bundlePath, $bundleText, $utf8NoBom)

Write-Host "Built bundle: $bundlePath"
Write-Host "Fragments:"
$parts | ForEach-Object {
  Write-Host (" - {0}" -f $_.Name)
}
