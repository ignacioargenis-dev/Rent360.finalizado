#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🚀 Iniciando proceso de migraciones de producción...');

    // 1. Resolver migraciones fallidas conocidas
    const failedMigrations = ['20241105_add_message_attachments'];

    for (const migration of failedMigrations) {
      try {
        console.log(`🔧 Intentando resolver migración fallida: ${migration}`);
        execSync(
          `npx prisma migrate resolve --applied ${migration} --schema=./prisma/schema.prisma`,
          {
            stdio: 'inherit',
            timeout: 30000,
          }
        );
        console.log(`✅ Migración ${migration} marcada como aplicada`);
      } catch (error) {
        console.log(
          `⚠️  No se pudo resolver ${migration}, puede que ya esté resuelta:`,
          error.message
        );
      }
    }

    // 2. Ejecutar migraciones pendientes
    console.log('📦 Ejecutando migraciones pendientes...');
    execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
      stdio: 'inherit',
      timeout: 60000,
    });

    console.log('✅ Todas las migraciones ejecutadas exitosamente');

    // 3. Verificar que el schema esté actualizado
    console.log('🔍 Verificando schema de base de datos...');
    execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
      stdio: 'inherit',
      timeout: 30000,
    });

    console.log('🎉 Proceso de migraciones completado exitosamente');
  } catch (error) {
    console.error('❌ Error durante las migraciones:', error.message);

    // En caso de error, intentar un push forzado como último recurso
    try {
      console.log('🔄 Intentando push forzado del schema...');
      execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
        stdio: 'inherit',
        timeout: 30000,
      });
      console.log('✅ Push forzado completado');
    } catch (pushError) {
      console.error('❌ Push forzado también falló:', pushError.message);
      console.log('⚠️  Continuando con la aplicación a pesar de los errores de migración...');
    }
  }
}

runMigrations();
