@echo off
cd /d C:\Users\Perrita\Documents\GitHub\Rent360.finalizado
echo ================================================
echo SUBIENDO CAMBIOS A GITHUB
echo ================================================
echo.

echo [1/4] Estado del repositorio:
git status --short
echo.

echo [2/4] Agregando cambios...
git add .
echo.

echo [3/4] Creando commit...
git commit -m "fix: correccion final error TypeScript createdAt

- Resolver definitivamente error 'string | undefined'
- Usar substring(0, 10) para formato seguro YYYY-MM-DD
- Preparar para despliegue DigitalOcean App Platform"
echo.

echo [4/4] Subiendo a GitHub...
git push origin master
echo.

echo ================================================
echo ¡CAMBIOS SUBIDOS EXITOSAMENTE!
echo ================================================
echo.
pause
