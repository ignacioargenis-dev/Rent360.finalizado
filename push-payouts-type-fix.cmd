@echo off
echo Corrigiendo error de tipo en providers/payouts...
echo.

REM Agregar archivo modificado
git add "src/app/api/admin/providers/payouts/route.ts"

REM Crear commit
git commit -m "fix: Tipificar variable payouts en providers/payouts API

- Agregar import ProviderPayoutCalculation
- Tipificar variable payouts: ProviderPayoutCalculation[]
- Resolver error 'implicitly has type any[]'
- Archivo: src/app/api/admin/providers/payouts/route.ts
- Linea 27 corregida con tipo explicito"

REM Push
git push origin master

echo.
echo Correccion subida exitosamente: %date% %time%
