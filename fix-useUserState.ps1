# Script para reemplazar useUserState por useAuth en todos los archivos
Write-Host "🔄 Iniciando reemplazo masivo de useUserState por useAuth..."

# Obtener todos los archivos TypeScript/React
$files = Get-ChildItem -Path src -Recurse -Include "*.tsx","*.ts" | Where-Object {
    $_.FullName -notlike "*node_modules*"
}

$updatedFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Verificar si el archivo contiene useUserState
    if ($content -match "useUserState") {
        Write-Host "📝 Procesando: $($file.FullName)"

        # Reemplazar import
        $content = $content -replace "import \{ useUserState \} from '@/hooks/useUserState';", "import { useAuth } from '@/components/auth/AuthProvider';"

        # Reemplazar uso de useUserState() por useAuth()
        $content = $content -replace "useUserState\(\)", "useAuth()"

        # Guardar archivo
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8

        $updatedFiles++
        Write-Host "✅ Actualizado: $($file.Name)"
    }
}

Write-Host "🎉 Proceso completado. Archivos actualizados: $updatedFiles"
