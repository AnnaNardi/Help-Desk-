$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $PSScriptRoot
$executablePath = Join-Path $PSScriptRoot 'pocketbase.exe'
$dataDirectory = Join-Path $PSScriptRoot 'pb_data'
$logsDirectory = Join-Path $PSScriptRoot 'logs'
$stdoutPath = Join-Path $logsDirectory 'backend.log'
$stderrPath = Join-Path $logsDirectory 'backend-error.log'

if (-not (Test-Path -LiteralPath $executablePath)) {
  throw 'PocketBase não está instalado. Execute primeiro: npm run backend:setup'
}

New-Item -ItemType Directory -Path $dataDirectory, $logsDirectory -Force | Out-Null
$backendArguments = 'serve --http=127.0.0.1:8090 --dir="{0}"' -f $dataDirectory
$backendProcess = Start-Process -FilePath $executablePath -ArgumentList $backendArguments -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

try {
  $backendReady = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if ($backendProcess.HasExited) {
      $details = if (Test-Path -LiteralPath $stderrPath) { Get-Content -LiteralPath $stderrPath -Tail 30 | Out-String } else { '' }
      throw "PocketBase encerrou ao iniciar. Confira pocketbase/logs/backend-error.log.`n$details"
    }

    try {
      $null = Invoke-RestMethod -Uri 'http://127.0.0.1:8090/api/health' -TimeoutSec 2
      $backendReady = $true
      break
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  if (-not $backendReady) {
    throw 'PocketBase não respondeu em http://127.0.0.1:8090. Confira pocketbase/logs/backend-error.log.'
  }

  Write-Host 'PocketBase está pronto em http://127.0.0.1:8090'
  Write-Host 'Frontend em http://127.0.0.1:8080 — pressione Ctrl+C para encerrar os dois.'
  Push-Location $projectDirectory
  try {
    & npm run dev -- --host 127.0.0.1
    if ($LASTEXITCODE -ne 0) { throw "O Vite encerrou com código $LASTEXITCODE." }
  } finally {
    Pop-Location
  }
} finally {
  if (-not $backendProcess.HasExited) {
    Stop-Process -Id $backendProcess.Id -Force
  }
}
