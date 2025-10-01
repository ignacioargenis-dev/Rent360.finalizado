# Script para corregir JSX comprimido en archivos TSX
$files = Get-ChildItem -Path "src/app/admin" -Recurse -Filter "*.tsx" | Where-Object {
    (Get-Content $_.FullName -Raw) -match '<div className="min-h-screen bg-gray-50"><div className="flex"><div className="w-64'
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Patrón a reemplazar
    $pattern = '<div className="min-h-screen bg-gray-50"><div className="flex"><div className="w-64 bg-white shadow-lg"><div className="p-4"><h2 className="text-lg font-semibold">Rent360 Admin</h2></div></div><div className="flex-1"><div className="p-6">'

    # Reemplazo
    $replacement = @"
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6">
"@

    if ($content -match [regex]::Escape($pattern)) {
        $newContent = $content -replace [regex]::Escape($pattern), $replacement
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Corregido: $($file.FullName)"
    }
}
