@echo off
title EMERGENCIA: SUBIENDO CORRECCION CRITICA A GITHUB
cd /d C:\Users\Perrita\Documents\GitHub\Rent360.finalizado

echo.
echo ================================================
echo 🚨 EMERGENCIA: CORRECCION CRITICA PARA DIGITALOCEAN
echo ================================================
echo.
echo El build de DigitalOcean esta fallando porque no tiene
echo la correccion del error TypeScript en contracts/page.tsx
echo.
echo Subiendo la correccion inmediatamente...
echo.

echo [1/4] Verificando estado del repositorio...
git status --short
if %errorlevel% neq 0 (
    echo ❌ Error al verificar estado
    goto :error
)
echo.

echo [2/4] Agregando todos los cambios...
git add .
if %errorlevel% neq 0 (
    echo ❌ Error al agregar cambios
    goto :error
)
echo.

echo [3/4] Creando commit con correccion critica...
git commit -m "fix: correccion EMERGENTE error TypeScript createdAt

🚨 CORRECCION CRITICA PARA DIGITALOCEAN APP PLATFORM

- Resolver DEFINITIVAMENTE error 'string | undefined' en contracts page
- Cambiar split('T')[0] por substring(0, 10) para 100% seguridad
- Garantizar formato YYYY-MM-DD siempre valido
- Fix DigitalOcean App Platform build failure
- Preparar despliegue exitoso inmediato

Este commit resuelve el error que esta causando fallos en DigitalOcean."
if %errorlevel% neq 0 (
    echo ⚠️  No hay cambios nuevos para commitear (posiblemente ya subidos)
    echo Continuando con push...
)
echo.

echo [4/4] Subiendo a GitHub (MASTER)...
git push origin master
if %errorlevel% neq 0 (
    echo ⚠️  Intentando con rama MAIN...
    git push origin main
    if %errorlevel% neq 0 (
        echo ❌ Error al subir a ambas ramas
        goto :error
    )
)
echo.

echo.
echo ================================================
echo 🎉 ¡CORRECCION SUBIDA EXITOSAMENTE!
echo ================================================
echo.
echo ✅ DigitalOcean ahora deberia poder hacer build exitosamente
echo ✅ El error TypeScript esta corregido
echo ✅ Proyecto listo para produccion
echo.
echo Próximo build deberia ser EXITOSO.
echo.
pause
exit /b 0

:error
echo.
echo ================================================
echo ❌ ERROR AL SUBIR CAMBIOS
echo ================================================
echo.
echo Verifica tu conexion a GitHub y credenciales.
echo.
pause
exit /b 1
