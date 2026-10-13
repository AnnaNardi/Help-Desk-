$ErrorActionPreference = 'Stop'

$version = '0.40.4'
$archivePath = Join-Path $PSScriptRoot 'pocketbase_windows.zip'
$temporaryDirectory = Join-Path $PSScriptRoot 'pocketbase-download-temp'
$executablePath = Join-Path $PSScriptRoot 'pocketbase.exe'
$downloadUrl = "https://github.com/pocketbase/pocketbase/releases/download/v$version/pocketbase_${version}_windows_amd64.zip"

if (-not (Test-Path -LiteralPath $archivePath)) {
  $downloadedArchive = Join-Path $env:USERPROFILE "Downloads\pocketbase_${version}_windows_amd64.zip"
  if (Test-Path -LiteralPath $downloadedArchive) {
    Copy-Item -LiteralPath $downloadedArchive -Destination $archivePath
    Write-Host "Usando o PocketBase baixado da pasta Downloads: $archivePath"
  } else {
    Write-Host "Baixando PocketBase v$version do GitHub oficial..."
    Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath
  }
} else {
  Write-Host "Usando o arquivo PocketBase já baixado: $archivePath"
}

if (Test-Path -LiteralPath $temporaryDirectory) {
  $resolvedTemporaryDirectory = [System.IO.Path]::GetFullPath($temporaryDirectory)
  $resolvedPocketBaseDirectory = [System.IO.Path]::GetFullPath($PSScriptRoot) + [System.IO.Path]::DirectorySeparatorChar
  if (-not $resolvedTemporaryDirectory.StartsWith($resolvedPocketBaseDirectory, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Pasta temporária fora da pasta PocketBase: $resolvedTemporaryDirectory"
  }
  Remove-Item -LiteralPath $resolvedTemporaryDirectory -Recurse -Force
}

Expand-Archive -LiteralPath $archivePath -DestinationPath $temporaryDirectory -Force
$downloadedExecutable = Join-Path $temporaryDirectory 'pocketbase.exe'
if (-not (Test-Path -LiteralPath $downloadedExecutable)) {
  throw 'O arquivo baixado não contém pocketbase.exe.'
}

Move-Item -LiteralPath $downloadedExecutable -Destination $executablePath -Force
Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
Write-Host "PocketBase instalado em $executablePath"
