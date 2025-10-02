# Script para corregir los archivos admin restantes que usan DashboardLayout
# Aplica el patrón de corrección UnifiedDashboardLayout

$filesToFix = @(
    "src/app/admin/contracts/page.tsx",
    "src/app/admin/payments/processor/page.tsx",
    "src/app/admin/payments/reports/page.tsx",
    "src/app/admin/predictive-analytics/page.tsx",
    "src/app/admin/properties/page.tsx"
)

foreach ($file in $filesToFix) {
    if (Test-Path $file) {
        Write-Host "Fixing: $file"

        $content = Get-Content $file -Raw -Encoding UTF8

        # Agregar importación de UnifiedDashboardLayout si no existe
        if ($content -notmatch "UnifiedDashboardLayout") {
            $content = $content -replace "import \{([^}]*)\} from '@/components/ui/tabs';", "`$0`nimport UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';"
        }

        # Simplificar estado de loading
        $content = $content -replace "(  if \(loading[^}]*?\{[\s\S]*?<div className=`"min-h-screen bg-gray-50 flex items-center justify-center`">[\s\S]*?</div>[\s\S]*?\};)", "  if (loading) {`n    return (`n      <div className=`"flex items-center justify-center h-64`">`n        <div className=`"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600`"></div>`n        <p className=`"text-gray-600`">Cargando...</p>`n      </div>`n    );`n  }"

        # Cambiar return principal
        $content = $content -replace "(  return \(\s*<div className=`"min-h-screen bg-gray-50`">[\s\S]*?<div className=`"flex-1`">[\s\S]*?<div className=`"p-6`">)", "  return (`n    <UnifiedDashboardLayout title=`"Panel de Administración`" subtitle=`"Gestiona el sistema`">`n      <div className=`"container mx-auto px-4 py-6`">"

        # Cambiar cierre
        $content = $content -replace "(    </div>\s*</div>\s*</div>\s*\);\s*\})", "      </div>`n    </UnifiedDashboardLayout>`n  );`n}"

        # Agregar importación de React si no existe
        if ($content -notmatch "import React") {
            $content = $content -replace "('use client';\s*\n)", "`$1`nimport React from 'react';`n"
        }

        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Fixed: $file"
    }
}
