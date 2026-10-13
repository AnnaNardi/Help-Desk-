$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$serverPath = Join-Path $PSScriptRoot 'server.js'
$logsDirectory = Join-Path $PSScriptRoot 'logs'
$stdoutPath = Join-Path $logsDirectory 'postgres-api.log'
$stderrPath = Join-Path $logsDirectory 'postgres-api-error.log'
$node = (Get-Command node.exe -ErrorAction Stop).Source
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$apiPort = 3001
$apiHealthUrl = "http://127.0.0.1:$apiPort/api/health"

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules\pg'))) {
  throw 'Dependência PostgreSQL ausente. Rode npm.cmd run backend:install no diretório do projeto.'
}
New-Item -ItemType Directory -Path $logsDirectory -Force | Out-Null

$quotedServerPath = '"{0}"' -f $serverPath
$backend = $null
$ready = $false
try {
  $null = Invoke-RestMethod -Uri $apiHealthUrl -TimeoutSec 2
  $ready = $true
  Write-Host "API PostgreSQL já está ativa em http://127.0.0.1:$apiPort"
} catch { }

if (-not $ready) {
  $backend = Start-Process -FilePath $node -ArgumentList $quotedServerPath -WorkingDirectory $projectDirectory -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
}
try {
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if ($ready) { break }
    if ($backend.HasExited) { break }
    try {
      $null = Invoke-RestMethod -Uri $apiHealthUrl -TimeoutSec 1
      $ready = $true
      break
    } catch { Start-Sleep -Milliseconds 500 }
  }
  if (-not $ready) {
    $details = if (Test-Path -LiteralPath $stderrPath) { Get-Content -LiteralPath $stderrPath -Tail 20 | Out-String } else { '' }
    throw "A API PostgreSQL não iniciou. Confira as variáveis no .env e o serviço PostgreSQL.`n$details"
  }
  Write-Host "API: http://127.0.0.1:$apiPort"
  Write-Host 'Frontend: http://localhost:8080 — pressione Ctrl+C para encerrar.'
  & $npm run dev -- --host 127.0.0.1
  if ($LASTEXITCODE -ne 0) { throw "O Vite encerrou com código $LASTEXITCODE." }
} finally {
  if ($backend -and -not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
}
