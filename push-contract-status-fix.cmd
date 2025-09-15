@echo off
echo Subiendo correccion del tipo status en contratos...
echo.

REM Agregar archivos modificados
git add "src/app/admin/contracts/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir tipo status en formulario de contratos

- Cambiar definicion de estado newContract para usar Contract['status']
- Eliminar 'as const' que causaba conflicto de tipos
- Resolver error: Type 'string' is not assignable to type 'DRAFT'
- Formulario Select ahora funciona correctamente con tipos flexibles"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
