@echo off
echo Subiendo correcciones de tipos TypeScript para properties/page.tsx...
echo.

REM Agregar archivos modificados
git add "src/app/admin/properties/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir tipos TypeScript en properties/page.tsx

- Eliminar interfaz Property local incompatible
- Usar interfaz Property global de @/types
- Actualizar mock data para compatibilidad completa
- Convertir fechas de string a Date objects
- Agregar campos requeridos: region, images, features, ownerId
- Corregir referencias en UI para usar nuevos campos
- Actualizar funcion createProperty para compatibilidad"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
