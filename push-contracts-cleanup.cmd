@echo off
echo Subiendo correcciones de limpieza de tipos TypeScript para contratos...
echo.

REM Agregar archivos modificados
git add "src/app/admin/contracts/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Limpiar objetos anidados problemáticos en contracts/page.tsx

- Eliminar objetos property, owner, tenant del mock data
- Usar solo referencias por ID (propertyId, ownerId, tenantId)
- Corregir filtros de búsqueda para usar IDs
- Actualizar UI para mostrar IDs en lugar de nombres
- Resolver errores de tipos TypeScript incompatibles"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
