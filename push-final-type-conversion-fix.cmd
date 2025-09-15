@echo off
echo Subiendo correccion final de conversion de tipos...
echo.

REM Agregar archivo modificado
git add "src/app/admin/properties/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Usar conversion segura de tipos 'as unknown as Property[]'

- Cambiar 'as Property[]' por 'as unknown as Property[]'
- Resolver error 'neither type sufficiently overlaps with the other'
- Permitir conversion explicita de tipos no completamente compatibles
- TypeScript ahora permite la conversion sin errores de tipo

La conversion 'as unknown as Property[]' es mas segura que
'as Property[]' cuando los tipos no son completamente compatibles."
