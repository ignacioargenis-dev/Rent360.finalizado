# Script para agregar importación de React a archivos TSX que lo necesiten
$files = Get-ChildItem -Path "src/app/admin" -Recurse -Filter "*.tsx" | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match "'use client'" -and
    $content -notmatch "import React" -and
    $content -match "import \{ useState|useEffect"
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Reemplazar la importación de hooks para incluir React
    $content = $content -replace "import \{ (useState|useEffect[^}]*)\ } from 'react';", "import React, { `$1 } from 'react';"

    Set-Content -Path $file.FullName -Value $content
    Write-Host "Actualizado: $($file.FullName)"
}
