# Script para corregir todas las páginas con problemas de acciones rápidas
# Busca todas las páginas que tienen el patrón problemático y las corrige

$files = Get-ChildItem -Path "src/app" -Recurse -Include "*.tsx" | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match 'h-20 flex flex-col items-center justify-center'
}

Write-Host "Encontradas $($files.Count) páginas con problemas de acciones rápidas:"
$files | ForEach-Object { Write-Host "  - $($_.FullName)" }

# Para cada archivo, aplicar las correcciones
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Agregar imports si no existen
    if ($content -notmatch "import.*QuickActionButton") {
        $content = $content -replace "import React, \{ useState, useEffect \} from 'react';\nimport \{ logger \} from '@/lib/logger';", "import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';"
    }

    # Agregar router en la función si no existe
    if ($content -match "export default function (\w+)Page\(\) \{") {
        $functionName = $matches[1]
        if ($content -notmatch "const router = useRouter\(\);") {
            $content = $content -replace "export default function ${functionName}Page\(\) \{\s*\n\s*const \[", "export default function ${functionName}Page() {
  const router = useRouter();

  const ["
        }
    }

    # Reemplazar la sección de acciones rápidas problemática con QuickActionButton
    $quickActionsPattern = "(?s)<!-- Acciones rápidas -->.*?<!--.*-->.*?</Card>"

    $replacement = @'
        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Agregar Nuevo"
                description="Crear elemento"
                onClick={() => alert('Funcionalidad: Agregar nuevo elemento')}
              />

              <QuickActionButton
                icon={Filter}
                label="Filtrar"
                description="Buscar y filtrar"
                onClick={() => alert('Funcionalidad: Abrir filtros avanzados')}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar"
                description="Descargar datos"
                onClick={() => alert('Funcionalidad: Exportar datos')}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Reportes"
                description="Ver estadísticas"
                onClick={() => router.push('/admin/reports')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuración"
                description="Ajustes del sistema"
                onClick={() => router.push('/admin/settings')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar datos"
                onClick={() => loadPageData()}
              />
            </div>
          </CardContent>
        </Card>
'@

    # Aplicar el reemplazo
    $content = [regex]::Replace($content, $quickActionsPattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Singleline)

    # Guardar el archivo
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8

    Write-Host "Corregido: $($file.FullName)"
}

Write-Host "Corrección completada. Se corrigieron $($files.Count) archivos."
