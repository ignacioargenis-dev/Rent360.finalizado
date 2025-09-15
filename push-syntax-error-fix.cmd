@echo off
echo Subiendo correccion de sintaxis en property-comparison/page.tsx...
echo.

REM Agregar archivos modificados
git add "src/app/owner/property-comparison/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir sintaxis en property-comparison/page.tsx

- Eliminar lineas sueltas de interfaz Property eliminada
- Resolver error 'Expression expected' en linea 33
- Limpiar codigo residual despues de eliminar interfaz local
- Archivo ahora compila correctamente"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
