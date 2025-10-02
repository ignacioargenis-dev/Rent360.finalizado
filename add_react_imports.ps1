# Script para agregar importaciones de React a archivos que las necesitan
# Con jsx: "preserve" se requieren importaciones explícitas

$adminFiles = Get-ChildItem -Path "src/app/admin" -Filter "*.tsx" -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules"
}

foreach ($file in $adminFiles) {
    $content = Get-Content $file.FullName -Raw

    # Verificar si ya tiene import React
    if ($content -notmatch "import React") {
        # Agregar import React después de 'use client'
        $content = $content -replace "('use client';\s*\n)", "`$1`nimport React from 'react';`n"
    }

    Set-Content -Path $file.FullName -Value $content
    Write-Host "Added React import to: $($file.FullName)"
}
