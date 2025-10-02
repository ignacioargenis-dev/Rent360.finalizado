# Script para arreglar indentación en archivos admin
# Reemplaza múltiples espacios por la indentación correcta

param(
    [string]$FilePath
)

$content = Get-Content $FilePath -Raw

# Arreglar indentación dentro del UnifiedDashboardLayout
$content = $content -replace "(?m)^(\s{8,})(<\w)", "      `$2"

# Arreglar casos específicos de indentación excesiva
$content = $content -replace "(?m)^(\s{12,})", "        "

Set-Content -Path $FilePath -Value $content
Write-Host "Fixed indentation in: $($FilePath)"
