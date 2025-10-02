# Script mejorado para arreglar layouts en archivos admin
# Solo arregla los estados de loading y la estructura principal

$adminFiles = Get-ChildItem -Path "src/app/admin" -Filter "*.tsx" -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules"
}

foreach ($file in $adminFiles) {
    $content = Get-Content $file.FullName -Raw

    # Arreglar estados de loading que terminan con </UnifiedDashboardLayout>
    $content = $content -replace "(\s*<div className=`"min-h-screen bg-gray-50 flex items-center justify-center`">.*?</div>\s*)\s*</UnifiedDashboardLayout>", '$1</div>'

    # Asegurarse de que los estados de loading estén correctamente cerrados
    $content = $content -replace "(  if \(loading\) \{\s*return \(\s*<div className=`"min-h-screen bg-gray-50 flex items-center justify-center`">.*?</div>\s*\);\s*\})", "`$1`n  }"

    Set-Content -Path $file.FullName -Value $content
    Write-Host "Fixed loading state in: $($file.FullName)"
}
