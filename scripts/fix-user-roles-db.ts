/**
 * Script para normalizar roles de usuarios en la base de datos
 * Convierte todos los roles a MAYÚSCULAS
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('🔄 Iniciando normalización de roles...\n');

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`📊 Encontrados ${users.length} usuarios\n`);

    // Mostrar estado actual
    console.log('📋 Estado actual de roles:');
    users.forEach(user => {
      console.log(`  - ${user.email}: "${user.role}"`);
    });
    console.log('');

    // Actualizar cada usuario
    let updatedCount = 0;
    for (const user of users) {
      const normalizedRole = user.role.toUpperCase();

      if (user.role !== normalizedRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: normalizedRole as any },
        });
        console.log(`✅ Actualizado: ${user.email} (${user.role} → ${normalizedRole})`);
        updatedCount++;
      } else {
        console.log(`⏭️  Ya correcto: ${user.email} (${user.role})`);
      }
    }

    console.log(`\n✨ Proceso completado: ${updatedCount} usuarios actualizados\n`);

    // Verificar resultado
    const updatedUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
      },
    });

    console.log('📋 Estado final de roles:');
    updatedUsers.forEach(user => {
      console.log(`  - ${user.email}: "${user.role}"`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
