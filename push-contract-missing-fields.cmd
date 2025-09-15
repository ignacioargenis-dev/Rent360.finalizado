@echo off
echo Subiendo correcciones de campos faltantes en contratos...
echo.

REM Agregar archivos modificados
git add "src/app/admin/contracts/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Agregar campos faltantes a mock data de contratos

- Agregar brokerId, terms, signedAt, terminatedAt a contratos mock
- Actualizar funcion createContract con todos los campos requeridos
- Resolver error: 'missing properties from type Contract'
- Compatibilidad completa con interfaz global Contract"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
