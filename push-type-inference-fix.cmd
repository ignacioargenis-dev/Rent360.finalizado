@echo off
echo Subiendo correcciones para problema de inferencia de tipos...
echo.

REM Agregar archivo modificado
git add "src/app/admin/properties/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Resolver problema de inferencia de tipos en mockProperties

- Eliminar anotacion explicita Property[] del array mockProperties
- Dejar que TypeScript infiera el tipo automaticamente
- Agregar conversion explicita 'as Property[]' al asignar al estado
- Resolver error 'Type string[] is not assignable to type string'

El problema era que la anotacion explicita Property[] estaba causando
que TypeScript no pudiera inferir correctamente los tipos de las
propiedades images y features dentro del array."
