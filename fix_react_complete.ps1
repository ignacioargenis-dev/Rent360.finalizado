# Script completo para agregar importación de React a TODOS los archivos TSX que la necesiten
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match "'use client'" -and
    $content -match "import \{.*useState|useEffect" -and
    $content -notmatch "import React"
}

Write-Host "Archivos encontrados que necesitan corrección: $($files.Count)"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Buscar la línea de importación de hooks
    $hookImportPattern = "import \{ ([^}]+) \} from 'react';"
    if ($content -match $hookImportPattern) {
        $hooks = $matches[1]
        $newImport = "import React, { $hooks } from 'react';"

        # Reemplazar la importación
        $oldImport = "import { $hooks } from 'react';"
        $content = $content -replace [regex]::Escape($oldImport), $newImport

        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "✓ Corregido: $($file.FullName)"
    } else {
        Write-Host "⚠ No se pudo procesar: $($file.FullName)"
    }
}

Write-Host "Proceso completado. Total archivos procesados: $($files.Count)"
