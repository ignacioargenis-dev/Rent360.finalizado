@echo off
echo Corrigiendo error de tipo en providers/payouts/stats...
echo.

REM Agregar archivo modificado
git add "src/app/api/admin/providers/payouts/stats/route.ts"

REM Crear commit
git commit -m "fix: Tipificar error en catch block de providers/payouts/stats

- Resolver error 'Argument of type unknown is not assignable'
- Tipificar error como Error en logger.error y handleError
- Archivo: src/app/api/admin/providers/payouts/stats/route.ts
- Linea 30 corregida con cast 'as Error'"

REM Push
git push origin master

echo.
echo Correccion subida exitosamente: %date% %time%
