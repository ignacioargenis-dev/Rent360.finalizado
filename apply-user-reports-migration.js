/**
 * Script para aplicar la migración de user_reports en producción
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyUserReportsMigration() {
  console.log('🚀 Aplicando migración de user_reports...\n');

  try {
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');

    // Verificar si la tabla ya existe
    const existingTable = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_reports';
    `;

    if (existingTable.length > 0) {
      console.log('⚠️ La tabla user_reports ya existe, omitiendo creación');
      return;
    }

    console.log('📋 Creando tabla user_reports...');

    // Crear la tabla user_reports
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS "user_reports" (
          "id" TEXT NOT NULL,
          "reporterId" TEXT NOT NULL,
          "reportedUserId" TEXT NOT NULL,
          "reason" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "adminNotes" TEXT,
          "reviewedBy" TEXT,
          "reviewedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
      );
    `;

    console.log('✅ Tabla user_reports creada');

    // Crear índices
    console.log('📋 Creando índices...');

    await prisma.$queryRaw`
      CREATE INDEX IF NOT EXISTS "user_reports_reporterId_idx" ON "user_reports"("reporterId");
    `;

    await prisma.$queryRaw`
      CREATE INDEX IF NOT EXISTS "user_reports_reportedUserId_idx" ON "user_reports"("reportedUserId");
    `;

    await prisma.$queryRaw`
      CREATE INDEX IF NOT EXISTS "user_reports_status_idx" ON "user_reports"("status");
    `;

    await prisma.$queryRaw`
      CREATE INDEX IF NOT EXISTS "user_reports_createdAt_idx" ON "user_reports"("createdAt");
    `;

    console.log('✅ Índices creados');

    // Crear foreign keys
    console.log('📋 Creando foreign keys...');

    try {
      await prisma.$queryRaw`
        ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporterId_fkey"
        FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (error) {
      console.log('⚠️ Foreign key reporterId ya existe o no se puede crear');
    }

    try {
      await prisma.$queryRaw`
        ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reportedUserId_fkey"
        FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (error) {
      console.log('⚠️ Foreign key reportedUserId ya existe o no se puede crear');
    }

    try {
      await prisma.$queryRaw`
        ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reviewedBy_fkey"
        FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `;
    } catch (error) {
      console.log('⚠️ Foreign key reviewedBy ya existe o no se puede crear');
    }

    console.log('✅ Foreign keys creadas');

    // Verificar que la tabla se creó correctamente
    const verifyTable = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_reports';
    `;

    if (verifyTable.length > 0) {
      console.log('🎉 Migración aplicada exitosamente!');
      console.log('📊 Tabla user_reports creada y configurada');
    } else {
      console.log('❌ Error: La tabla no se creó correctamente');
    }
  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
applyUserReportsMigration();
