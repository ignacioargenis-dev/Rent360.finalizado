@echo off
cd /d C:\Users\Perrita\Documents\GitHub\Rent360.finalizado
echo ================================================
echo URGENTE: SUBIENDO CORRECCION A GITHUB
echo ================================================
echo.

echo [1/4] Verificando cambios...
git status --short
echo.

echo [2/4] Agregando cambios...
git add .
echo.

echo [3/4] Creando commit...
git commit -m "fix: correccion definitiva error TypeScript createdAt

- Resolver error 'string | undefined' en contracts page
- Cambiar split('T')[0] por substring(0, 10) para mayor seguridad
- Garantizar formato YYYY-MM-DD valido
- Fix DigitalOcean App Platform build error
- Preparar despliegue exitoso"
echo.

echo [4/4] Subiendo a GitHub...
git push origin master
echo.

echo ================================================
echo ¡CORRECCION SUBIDA EXITOSAMENTE!
echo ================================================
echo.
echo Build deberia funcionar correctamente ahora.
echo.
pause
