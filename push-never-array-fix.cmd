@echo off
echo Subiendo correcciones para Type 'never[]' is not assignable to type 'string'...
echo.

REM Agregar archivos modificados
git add "src/app/admin/properties/page.tsx"
git add "src/app/broker/properties/new/page.tsx"
git add "src/app/owner/properties/new/page.tsx"
git add "src/app/tenant/contracts/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Resolver error 'Type never[] is not assignable to type string'

- Agregar constantes explícitas para arrays vacíos tipados
- Reemplazar [] con constantes string[] tipadas explícitamente
- Resolver inferencia de tipos never[] en objetos Property
- TypeScript ahora infiere correctamente tipos string[] en lugar de never[]

Archivos corregidos:
- src/app/admin/properties/page.tsx
- src/app/broker/properties/new/page.tsx
- src/app/owner/properties/new/page.tsx
- src/app/tenant/contracts/page.tsx"
