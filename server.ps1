<#
.SYNOPSIS
  Servidor Local HTTP nativo do Payin em PowerShell (.NET HttpListener)
  Sem nenhuma dependência externa (funciona em qualquer Windows).
#>

$port = 8080
if ([string]::IsNullOrWhiteSpace($PSScriptRoot)) {
    $baseDir = (Get-Location).Path
} else {
    $baseDir = $PSScriptRoot
}
$dataDir = Join-Path $baseDir "data"
$dbFile = Join-Path $dataDir "database.json"
$csvFile = Join-Path $dataDir "despesas_payin.csv"

# Garantir existência da pasta data
if (!(Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

# Iniciar Listener
$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    $port = 8085
    $prefix = "http://localhost:$port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix)
    $listener.Start()
}

Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host "          PAYIN - GESTAO FINANCEIRA INTELIGENTE           " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host " Servidor rodando em: $prefix" -ForegroundColor Green
Write-Host " Pasta de dados:     $dataDir" -ForegroundColor Cyan
Write-Host " Pressione Ctrl+C na janela para encerrar." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor DarkYellow

# Função para exportar CSV a partir do JSON recebido
function Export-ExpensesCsv($jsonData) {
    try {
        $dataObj = $jsonData | ConvertFrom-Json
        if ($dataObj.expenses) {
            $csvRows = @()
            $headers = "ID;Usuario;Mes Competencia;Data;Tipo;O Que Foi Comprado / Descricao;Tipo Conta Fixa;Categoria;Valor (R$);Condicao Pagamento;Meio Pagamento;Parcela Atual;Total Parcelas;Status;Observacoes"
            $csvRows += $headers

            foreach ($exp in $dataObj.expenses) {
                $user = $dataObj.users | Where-Object { $_.id -eq $exp.userId } | Select-Object -First 1
                $userName = if ($user) { $user.name } else { "Usuario" }
                $tipoStr = if ($exp.type -eq "fixo") { "Conta Fixa" } else { "Conta Variavel" }
                $termStr = if ($exp.paymentTerm -eq "prazo") { "A Prazo" } else { "A Vista" }
                $statusStr = if ($exp.status -eq "pago") { "Pago" } else { "Pendente" }
                $valorStr = ("{0:N2}" -f [double]$exp.amount).Replace(".", "") # Mantem virgula

                $row = '{0};"{1}";{2};{3};"{4}";"{5}";"{6}";"{7}";{8};"{9}";"{10}";{11};{12};"{13}";"{14}"' -f `
                    $exp.id, `
                    $userName.Replace('"', '""'), `
                    $exp.targetMonth, `
                    $exp.date, `
                    $tipoStr, `
                    ($exp.description -replace '"', '""'), `
                    ($exp.fixedAccountType -replace '"', '""'), `
                    ($exp.category -replace '"', '""'), `
                    $valorStr, `
                    $termStr, `
                    ($exp.paymentMethod -replace '"', '""'), `
                    $exp.installmentCurrent, `
                    $exp.installmentTotal, `
                    $statusStr, `
                    ($exp.notes -replace '"', '""')

                $csvRows += $row
            }

            [System.IO.File]::WriteAllLines($csvFile, $csvRows, [System.Text.Encoding]::UTF8)
        }
    } catch {
        Write-Warning "Aviso ao gerar CSV automatico: $_"
    }
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Habilitar CORS
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $urlPath = $request.Url.LocalPath

        # API: Status
        if ($urlPath -eq "/api/status") {
            $response.ContentType = "application/json; charset=utf-8"
            $json = '{"status":"ok","app":"Payin","version":"1.0"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # API: Salvar Banco e CSV
        if ($urlPath -eq "/api/save" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            
            # Salvar no database.json
            [System.IO.File]::WriteAllText($dbFile, $body, [System.Text.Encoding]::UTF8)

            # Gerar CSV local automaticamente
            Export-ExpensesCsv -jsonData $body

            $response.ContentType = "application/json; charset=utf-8"
            $json = '{"success":true,"message":"Salvo no disco com sucesso e CSV atualizado"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # API: Obter Dados
        if ($urlPath -eq "/api/data") {
            $response.ContentType = "application/json; charset=utf-8"
            if (Test-Path $dbFile) {
                $content = [System.IO.File]::ReadAllText($dbFile, [System.Text.Encoding]::UTF8)
            } else {
                $content = '{"users":[],"expenses":[],"incomes":[]}'
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # Servir Arquivos Estaticos
        $filePath = $urlPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($filePath) -or $filePath -eq "/") {
            $filePath = "index.html"
        }
        $fullPath = Join-Path $baseDir $filePath

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
                ".csv"  { $response.ContentType = "text/csv; charset=utf-8" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                ".png"  { $response.ContentType = "image/png" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".ico"  { $response.ContentType = "image/x-icon" }
                default { $response.ContentType = "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - Arquivo nao encontrado")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }

        $response.Close()
    } catch {
        # Listener interrompido ou conexao fechada
    }
}
