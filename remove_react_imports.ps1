# Script para remover importaciones de React de archivos admin
# Con jsx: "react-jsx" no se necesitan importaciones explícitas

$adminFiles = Get-ChildItem -Path "src/app/admin" -Filter "*.tsx" -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules"
}

foreach ($file in $adminFiles) {
    $content = Get-Content $file.FullName -Raw

    # Remover importaciones de React
    $content = $content -replace "import React, \{([^}]*)\} from 'react';", "import {$1} from 'react';"
    $content = $content -replace "import React from 'react';\s*", ""

    Set-Content -Path $file.FullName -Value $content
    Write-Host "Removed React import from: $($file.FullName)"
}
