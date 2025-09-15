@echo off
echo Subiendo correccion del campo title faltante en contratos...
echo.

REM Agregar archivos modificados
git add "src/app/admin/contracts/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Agregar campo title faltante al estado newContract

- Agregar title: '' al estado inicial de newContract
- Actualizar funcion de reset del formulario
- Resolver error: Property 'title' does not exist on type
- Formulario de creacion de contratos ahora funciona correctamente"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
