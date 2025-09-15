@echo off
echo Aplicando correccion final y subiendo cambios a GitHub...

REM Agregar cambios
git add src/app/admin/contracts/page.tsx

REM Hacer commit
git commit -m "fix: corregir error de tipos en contratos - asegurar createdAt siempre sea string

- Agregar type annotation explicita para Contract
- Asegurar createdAt nunca sea undefined usando fallback
- Agregar id temporal para satisfacer el tipo Contract
- Prevenir errores de TypeScript en DigitalOcean App Platform
- Mejorar robustez del codigo de creacion de contratos"

REM Subir a GitHub
git push origin master

echo Cambios subidos exitosamente a GitHub
echo El build deberia funcionar correctamente ahora
pause
