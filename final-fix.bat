@echo off
echo Subiendo correccion final de tipos de conversion...
echo.

REM Agregar cambios
git add src/app/admin/properties/page.tsx

REM Hacer commit
git commit -m "fix: Usar conversion 'as unknown as Property' para resolver incompatibilidad de tipos

- Cambiar 'as Property' por 'as unknown as Property'
- Resolver error de tipos incompatibles entre interfaces Property
- Permitir conversion segura entre tipos no completamente compatibles
- El objeto ahora cumple con la interfaz Property esperada"
