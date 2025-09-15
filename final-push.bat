@echo off
echo ============================================
echo   CORRECCION FINAL - SUBIENDO A GITHUB
echo ============================================
echo.

echo [1/4] Verificando estado...
git status
echo.

echo [2/4] Agregando cambios...
git add src/app/admin/contracts/page.tsx
echo.

echo [3/4] Creando commit...
git commit -m "fix: corregir definitivamente error de tipos en createdAt

- Usar substring(0, 10) en lugar de split para mayor seguridad
- Garantizar que createdAt siempre sea string valido
- Resolver error TypeScript en DigitalOcean App Platform
- Mejorar robustez de la creacion de contratos"
echo.

echo [4/4] Subiendo a GitHub...
git push origin master
echo.

echo ============================================
echo   ¡CORRECCION FINAL COMPLETADA!
echo ============================================
echo.
echo Los cambios han sido subidos exitosamente.
echo El build deberia funcionar correctamente ahora.
echo.
pause
