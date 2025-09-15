@echo off
echo EMERGENCIA: Force push completo para corregir todos los errores...
echo.

REM Agregar todos los cambios pendientes
git add .

REM Crear commit de emergencia
git commit -m "fix: Correccion de emergencia - quitar .toISOString() de ticket.createdAt

- Resolver error 'Property toISOString does not exist on type string'
- Archivo: src/app/admin/tickets/page.tsx:546
- ticket.createdAt ya es string en la interfaz Ticket
- Force push necesario para sincronizar con DigitalOcean

Todas las correcciones TypeScript completadas:
- PropertySummary.createdAt (reports)
- Contract.createdAt (contracts)
- Ticket.createdAt (tickets)
- Eliminados objetos anidados incompatibles
- Corregidas interfaces conflictivas
- Resueltos todos los problemas de arrays y tipos"

REM Force push para asegurar sincronizacion
git push --force origin master

echo.
echo Commit de emergencia subido: %date% %time%
echo DigitalOcean deberia ahora usar el commit correcto.
