# Script para corregir TODOS los archivos admin restantes que usan DashboardLayout
# Aplica el patrón de corrección UnifiedDashboardLayout a todos los archivos

$filesToFix = Get-ChildItem -Path "src/app/admin" -Filter "*.tsx" -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules" -and
    $_.FullName -notmatch "backup\\page.tsx" -and
    $_.FullName -notmatch "contractors\\page.tsx" -and
    $_.FullName -notmatch "contracts\\page.tsx" -and
    $_.FullName -notmatch "dashboard\\page.tsx" -and
    $_.FullName -notmatch "executive-dashboard\\page.tsx" -and
    $_.FullName -notmatch "notifications-enhanced\\page.tsx" -and
    $_.FullName -notmatch "payments\\page.tsx" -and
    $_.FullName -notmatch "payments\\pending\\page.tsx" -and
    $_.FullName -notmatch "payments\\processor\\page.tsx" -and
    $_.FullName -notmatch "payments\\providers\\page.tsx" -and
    $_.FullName -notmatch "payments\\reports\\page.tsx" -and
    $_.FullName -notmatch "predictive-analytics\\page.tsx" -and
    $_.FullName -notmatch "properties\\page.tsx"
}

foreach ($file in $filesToFix) {
    Write-Host "Processing: $($file.FullName)"

    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # Agregar importación de UnifiedDashboardLayout si no existe
    if ($content -notmatch "UnifiedDashboardLayout") {
        $content = $content -replace "import \{([^}]*)\} from '@/components/ui/tabs';", "`$0`nimport UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';"
    }

    # Simplificar estado de loading
    $content = $content -replace "(?s)  if \(loading[^}]*?\{[\s\S]*?<div className=`"min-h-screen bg-gray-50 flex items-center justify-center`">[\s\S]*?</div>[\s\S]*?\};)", "  if (loading) {`n    return (`n      <div className=`"flex items-center justify-center h-64`">`n        <div className=`"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600`"></div>`n        <p className=`"text-gray-600`">Cargando...</p>`n      </div>`n    );`n  }"

    # Cambiar return principal
    $content = $content -replace "(?s)  return \(\s*<div className=`"min-h-screen bg-gray-50`">[\s\S]*?<div className=`"flex-1`">[\s\S]*?<div className=`"p-6`">)", "  return (`n    <UnifiedDashboardLayout title=`"Panel de Administración`" subtitle=`"Gestiona el sistema`">`n      <div className=`"container mx-auto px-4 py-6`">"

    # Cambiar cierre
    $content = $content -replace "(?s)(    </div>\s*</div>\s*</div>\s*\);\s*\})", "      </div>`n    </UnifiedDashboardLayout>`n  );`n}"

    # Agregar importación de React si no existe
    if ($content -notmatch "import React") {
        $content = $content -replace "('use client';\s*\n)", "`$1`nimport React from 'react';`n"
    }

    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    Write-Host "Fixed: $($file.FullName)"
}
