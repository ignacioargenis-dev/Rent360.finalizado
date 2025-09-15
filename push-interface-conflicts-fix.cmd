@echo off
echo Subiendo correccion de conflictos de interfaces Property...
echo.

REM Agregar archivos modificados
git add "src/app/owner/property-comparison/page.tsx"
git add "src/app/broker/properties/page.tsx"
git add "src/components/calendar/AppointmentForm.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Eliminar interfaces Property locales conflictivas

- Eliminar interfaz Property de owner/property-comparison/page.tsx
- Eliminar interfaz Property de broker/properties/page.tsx
- Renombrar interfaz Property a PropertyOption en calendar/AppointmentForm.tsx
- Usar interfaz Property global en todos los archivos
- Resolver conflictos de tipos entre interfaces locales y globales

Esto resuelve el error: Type 'string[]' is not assignable to type 'string'"
