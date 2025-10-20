# Script para corregir params.param as string a params?.param as string

Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'params\.(\w+) as string') {
        Write-Host "Procesando $($_.FullName)"
        $content = $content -replace 'params\.(\w+) as string', 'params?.$1 as string'
        Set-Content $_.FullName $content -NoNewline
    }
}

Write-Host "Corrección completada"
