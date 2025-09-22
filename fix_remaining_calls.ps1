# Script simple para corregir llamadas restantes
$files = @(
    "src/app/api/user/bank-accounts/[accountId]/route.ts",
    "src/app/api/signatures/[id]/cancel/route.ts",
    "src/app/api/runner/incentives/[incentiveId]/claim/route.ts",
    "src/app/api/maintenance/[id]/route.ts",
    "src/app/api/contractors/[id]/route.ts",
    "src/app/api/admin/providers/payouts/[transactionId]/approve/route.ts",
    "src/app/api/admin/legal-cases/[id]/route.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Corrigiendo $file..."
        $content = Get-Content $file

        # Cambiar imports
        $content = $content -replace "import { handleError } from '@/lib/errors';", "import { handleApiError } from '@/lib/api-error-handler';"
        $content = $content -replace "import { ValidationError, handleError } from '@/lib/errors';", "import { ValidationError, handleApiError } from '@/lib/api-error-handler';"

        # Cambiar llamadas
        $content = $content -replace "handleError\(", "handleApiError("

        # Cambiar logger.error calls
        $content = $content -replace "logger\.error\(([^,]+),\s*error\)", "logger.error(`$1, { error })"

        Set-Content $file $content
        Write-Host "✓ Corregido $file"
    } else {
        Write-Host "Archivo no encontrado: $file"
    }
}

Write-Host "Corrección completada."
