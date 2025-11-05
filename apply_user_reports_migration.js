const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyUserReportsMigration() {
  try {
    console.log('🔄 Aplicando migración de tabla user_reports...');

    // Verificar si la tabla ya existe
    try {
      await prisma.userReport.findFirst();
      console.log('✅ La tabla user_reports ya existe');
      return;
    } catch (error) {
      console.log('📝 La tabla user_reports no existe, creando...');
    }

    // Ejecutar la migración usando SQL directo
    const migrationSQL = `
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

      CREATE INDEX IF NOT EXISTS "user_reports_reporterId_idx" ON "user_reports"("reporterId");
      CREATE INDEX IF NOT EXISTS "user_reports_reportedUserId_idx" ON "user_reports"("reportedUserId");
      CREATE INDEX IF NOT EXISTS "user_reports_status_idx" ON "user_reports"("status");
      CREATE INDEX IF NOT EXISTS "user_reports_createdAt_idx" ON "user_reports"("createdAt");

      ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporterId_fkey"
          FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE;

      ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reportedUserId_fkey"
          FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE;

      ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reviewedBy_fkey"
          FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL;
    `;

    // Ejecutar SQL directo usando $queryRaw
    await prisma.$queryRawUnsafe(migrationSQL);

    console.log('✅ Migración aplicada exitosamente');

    // Verificar que la tabla se creó correctamente
    const testQuery = await prisma.userReport.findMany({ take: 1 });
    console.log('✅ Verificación exitosa: Tabla user_reports operativa');
  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyUserReportsMigration();
