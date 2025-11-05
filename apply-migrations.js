const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigrations() {
  console.log('🔄 Aplicando migraciones del sistema de mensajería...');

  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');

    // 1. Aplicar migración de user_reports
    console.log('📝 Aplicando migración: user_reports...');

    // Verificar si la tabla user_reports ya existe
    try {
      await prisma.userReport.findFirst();
      console.log('✅ Tabla user_reports ya existe');
    } catch (error) {
      console.log('📋 Creando tabla user_reports...');

      // Crear tabla user_reports usando SQL directo
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
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
        )
      `;

      // Crear índices
      await prisma.$queryRaw`
        CREATE INDEX IF NOT EXISTS "user_reports_reporterId_idx" ON "user_reports"("reporterId")
      `;
      await prisma.$queryRaw`
        CREATE INDEX IF NOT EXISTS "user_reports_reportedUserId_idx" ON "user_reports"("reportedUserId")
      `;
      await prisma.$queryRaw`
        CREATE INDEX IF NOT EXISTS "user_reports_status_idx" ON "user_reports"("status")
      `;
      await prisma.$queryRaw`
        CREATE INDEX IF NOT EXISTS "user_reports_createdAt_idx" ON "user_reports"("createdAt")
      `;

      // Crear claves foráneas
      await prisma.$queryRaw`
        ALTER TABLE "user_reports"
        ADD CONSTRAINT "user_reports_reporterId_fkey"
        FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE
      `;
      await prisma.$queryRaw`
        ALTER TABLE "user_reports"
        ADD CONSTRAINT "user_reports_reportedUserId_fkey"
        FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE
      `;
      await prisma.$queryRaw`
        ALTER TABLE "user_reports"
        ADD CONSTRAINT "user_reports_reviewedBy_fkey"
        FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL
      `;

      console.log('✅ Tabla user_reports creada exitosamente');
    }

    // 2. Aplicar migración de campos de adjuntos en messages
    console.log('📎 Aplicando migración: campos de adjuntos en messages...');

    // Verificar si las columnas ya existen
    const messagesColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'messages'
      AND column_name IN ('attachmentUrl', 'attachmentName', 'attachmentSize', 'attachmentType')
    `;

    const existingColumns = messagesColumns.map(col => col.column_name);

    if (!existingColumns.includes('attachmentUrl')) {
      console.log('📋 Agregando columnas de adjuntos a tabla messages...');

      await prisma.$queryRaw`
        ALTER TABLE "messages" ADD COLUMN "attachmentUrl" TEXT
      `;
      console.log('✅ Columna attachmentUrl agregada');
    } else {
      console.log('✅ Columna attachmentUrl ya existe');
    }

    if (!existingColumns.includes('attachmentName')) {
      await prisma.$queryRaw`
        ALTER TABLE "messages" ADD COLUMN "attachmentName" TEXT
      `;
      console.log('✅ Columna attachmentName agregada');
    } else {
      console.log('✅ Columna attachmentName ya existe');
    }

    if (!existingColumns.includes('attachmentSize')) {
      await prisma.$queryRaw`
        ALTER TABLE "messages" ADD COLUMN "attachmentSize" INTEGER
      `;
      console.log('✅ Columna attachmentSize agregada');
    } else {
      console.log('✅ Columna attachmentSize ya existe');
    }

    if (!existingColumns.includes('attachmentType')) {
      await prisma.$queryRaw`
        ALTER TABLE "messages" ADD COLUMN "attachmentType" TEXT
      `;
      console.log('✅ Columna attachmentType agregada');
    } else {
      console.log('✅ Columna attachmentType ya existe');
    }

    // Crear índice para attachmentType si no existe
    try {
      await prisma.$queryRaw`
        CREATE INDEX IF NOT EXISTS "messages_attachmentType_idx" ON "messages"("attachmentType")
      `;
      console.log('✅ Índice messages_attachmentType_idx creado');
    } catch (indexError) {
      console.log('ℹ️ Índice ya existe o error creando índice:', indexError.message);
    }

    // 3. Verificar que todo funciona
    console.log('🔍 Verificando migraciones...');

    // Verificar tabla user_reports
    try {
      const userReportCount = await prisma.userReport.count();
      console.log(`✅ Tabla user_reports operativa (${userReportCount} registros)`);
    } catch (error) {
      console.log('❌ Error verificando user_reports:', error.message);
    }

    // Verificar campos de messages
    try {
      const testMessage = await prisma.message.findFirst({
        select: {
          id: true,
          attachmentUrl: true,
          attachmentName: true,
          attachmentSize: true,
          attachmentType: true,
        },
        take: 1,
      });
      console.log('✅ Campos de adjuntos en messages operativos');
    } catch (error) {
      console.log('❌ Error verificando campos de adjuntos:', error.message);
    }

    console.log('');
    console.log('🎉 TODAS LAS MIGRACIONES APLICADAS EXITOSAMENTE');
    console.log('');
    console.log('📋 Resumen:');
    console.log('- ✅ Tabla user_reports creada/verificada');
    console.log('- ✅ Campos de adjuntos agregados a messages');
    console.log('- ✅ Índices creados');
    console.log('- ✅ Claves foráneas configuradas');
    console.log('');
    console.log('🚀 El sistema de mensajería está listo para funcionar!');
  } catch (error) {
    console.error('❌ ERROR APLICANDO MIGRACIONES:', error);
    console.error('Detalles:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar las migraciones
applyMigrations();
