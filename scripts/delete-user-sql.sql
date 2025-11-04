-- Script SQL para eliminar el usuario servicio@gmail.com
-- Este script eliminará el usuario y todos sus datos relacionados (cascade delete)

-- Primero, verificar que el usuario existe
SELECT id, name, email, role 
FROM "User" 
WHERE email = 'servicio@gmail.com';

-- Si el usuario existe y quieres eliminarlo, ejecuta:
DELETE FROM "User" 
WHERE email = 'servicio@gmail.com';

-- Nota: Debido a las relaciones ON DELETE CASCADE en Prisma,
-- esto eliminará automáticamente:
-- - ServiceProvider (si existe)
-- - MaintenanceProvider (si existe)
-- - ServiceJob (si existe)
-- - Maintenance (si existe)
-- - Y otros registros relacionados

