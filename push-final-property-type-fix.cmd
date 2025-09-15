@echo off
echo Subiendo correccion final de tipos en handleCreateProperty...
echo.

REM Agregar archivo modificado
git add "src/app/admin/properties/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir tipos en funcion handleCreateProperty

- Agregar 'as const' al status en handleCreateProperty
- Remover anotacion explicita Property del objeto
- Agregar conversion explicita 'as Property' al final
- Resolver error 'Type string[] is not assignable to type string'
- Mejorar inferencia de tipos en creacion de propiedades

La funcion ahora crea correctamente objetos Property sin errores de tipo."
