# Script para corregir imports de handleError por handleApiError
$files = git grep -l "handleError.*from.*@/lib/errors" -- "*.ts"

foreach ($file in $files) {
    Write-Host "Corrigiendo $file..."

    # Leer el contenido del archivo
    $content = Get-Content $file -Raw

    # Reemplazar imports
    $content = $content -replace "import { ValidationError, handleError } from '@/lib/errors';", "import { ValidationError, handleApiError } from '@/lib/api-error-handler';"
    $content = $content -replace "import { handleError } from '@/lib/errors';", "import { handleApiError } from '@/lib/api-error-handler';"

    # Cambiar llamadas de función
    $content = $content -replace "handleError\(", "handleApiError("

    # Escribir el archivo corregido
    Set-Content $file $content -NoNewline
}

Write-Host "Corrección completada. Archivos corregidos: $($files.Count)"
