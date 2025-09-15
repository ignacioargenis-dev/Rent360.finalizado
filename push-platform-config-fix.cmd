@echo off
echo Corrigiendo error de description en platform-config...
echo.

REM Agregar archivo modificado
git add "src/app/api/admin/platform-config/route.ts"

REM Crear commit
git commit -m "fix: Corregir error de tipo description en platform-config

- Resolver error 'Type string | undefined is not assignable to type string | null'
- Convertir undefined a null en campos description de Prisma upsert
- Archivo: src/app/api/admin/platform-config/route.ts
- Lineas corregidas: 104 y 111
- Usar operador ?? null para compatibilidad con exactOptionalPropertyTypes"

REM Push
git push origin master

echo.
echo Correccion subida exitosamente: %date% %time%
