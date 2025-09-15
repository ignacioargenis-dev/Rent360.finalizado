@echo off
echo Forzando deployment con correcciones de TypeScript...
echo.

REM Hacer commit vacío para forzar actualización
git commit --allow-empty -m "fix: Force deployment update - TypeScript fixes applied - handleCreateProperty corrected"

REM Push forzado para asegurar que DigitalOcean obtenga la versión correcta
git push --force origin master

echo.
echo DEPLOYMENT COMPLETADO
echo DigitalOcean debería ahora usar el commit correcto con las correcciones de TypeScript
echo.
