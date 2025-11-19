#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migración de campos response y responseDate...');

    // Verificar si los campos ya existen
    const checkColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_ratings' 
      AND column_name IN ('response', 'responseDate')
    `;

    const existingColumns = checkColumns.map(c => c.column_name);

    if (existingColumns.includes('response') && existingColumns.includes('responseDate')) {
      console.log('✅ Los campos response y responseDate ya existen en la tabla user_ratings');
      return;
    }

    // Aplicar migración
    console.log('📝 Agregando columnas response y responseDate...');

    if (!existingColumns.includes('response')) {
      await prisma.$executeRaw`
        ALTER TABLE "user_ratings" ADD COLUMN "response" TEXT
      `;
      console.log('✅ Columna "response" agregada');
    }

    if (!existingColumns.includes('responseDate')) {
      await prisma.$executeRaw`
        ALTER TABLE "user_ratings" ADD COLUMN "responseDate" TIMESTAMP(3)
      `;
      console.log('✅ Columna "responseDate" agregada');
    }

    // Verificar que se agregaron correctamente
    const verifyColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_ratings' 
      AND column_name IN ('response', 'responseDate')
    `;

    console.log('✅ Migración aplicada exitosamente. Columnas verificadas:');
    verifyColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Regenerar cliente de Prisma
    console.log('🔄 Regenerando cliente de Prisma...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Cliente de Prisma regenerado');

    console.log('🎉 Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
