# Script simplificado para corregir archivos restantes con handleError
Get-ChildItem -Path "src/app/api" -Recurse -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw

    # Verificar si el archivo contiene handleError de @/lib/errors
    if ($content -match "import.*handleError.*from.*@/lib/errors") {
        Write-Host "Corrigiendo $($_.FullName)..."

        # Cambiar imports
        $content = $content -replace "import { ValidationError, handleError } from '@/lib/errors';", "import { ValidationError, handleApiError } from '@/lib/api-error-handler';"
        $content = $content -replace "import { handleError } from '@/lib/errors';", "import { handleApiError } from '@/lib/api-error-handler';"

        # Cambiar llamadas de función
        $content = $content -replace "handleError\(", "handleApiError("

        # Cambiar logger.error calls
        $content = $content -replace "logger\.error\(([^,]+),\s*error\)", "logger.error($1, { error })"

        # Escribir el archivo
        Set-Content $_.FullName $content -NoNewline
        Write-Host "✓ Corregido $($_.Name)"
    }
}
