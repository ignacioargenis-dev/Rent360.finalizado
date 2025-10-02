# Script para arreglar layouts en archivos admin
# Agrega importación de UnifiedDashboardLayout y arregla la estructura JSX

$adminFiles = Get-ChildItem -Path "src/app/admin" -Filter "*.tsx" -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules"
}

foreach ($file in $adminFiles) {
    $content = Get-Content $file.FullName -Raw

    # Verificar si ya tiene UnifiedDashboardLayout
    if ($content -notmatch "UnifiedDashboardLayout") {
        # Agregar importación después de las otras importaciones
        $content = $content -replace "(import \{[^}]*\} from '@/components/ui/[^']*';)", "`$1`nimport UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';"

        # Solo si no existe ya
        if ($content -notmatch "import UnifiedDashboardLayout") {
            $content = $content -replace "(import React, \{[^}]*\} from 'react';)", "`$1`nimport UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';"
        }

        # Arreglar la estructura JSX - reemplazar div min-h-screen con UnifiedDashboardLayout
        $content = $content -replace "(  return \(\s*<div className=`"min-h-screen bg-gray-50`">)", "  return (`n    <UnifiedDashboardLayout title=`"Panel de Administración`" subtitle=`"Gestiona el sistema`">"

        # Cerrar UnifiedDashboardLayout en lugar del último div
        $content = $content -replace "(    </div>\s*\);\s*\})", "    </UnifiedDashboardLayout>`n  );`n}"

        Set-Content -Path $file.FullName -Value $content
        Write-Host "Fixed: $($file.FullName)"
    }
}
