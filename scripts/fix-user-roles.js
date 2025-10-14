#!/usr/bin/env node

/**
 * Script para corregir roles de usuarios existentes
 * Uso: node scripts/fix-user-roles.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('🔧 Iniciando corrección de roles de usuarios existentes...');

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📊 Encontrados ${users.length} usuarios`);

    // Roles válidos
    const validRoles = ['admin', 'tenant', 'owner', 'broker', 'provider', 'maintenance', 'runner', 'support'];

    // Usuarios con roles problemáticos
    const problematicUsers = users.filter(user =>
      !user.role ||
      !validRoles.includes(user.role.toLowerCase()) ||
      user.role !== user.role.toLowerCase()
    );

    if (problematicUsers.length === 0) {
      console.log('✅ No se encontraron usuarios con roles problemáticos');
      return;
    }

    console.log(`⚠️  Encontrados ${problematicUsers.length} usuarios con roles problemáticos:`);

    problematicUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): "${user.role}"`);
    });

    // Preguntar si se quiere proceder con la corrección
    console.log('\n🔄 Procediendo con la corrección automática...');

    // Corregir roles automáticamente
    for (const user of problematicUsers) {
      let newRole = 'tenant'; // Default seguro

      // Si el email contiene 'admin', asignar rol admin
      if (user.email.toLowerCase().includes('admin')) {
        newRole = 'admin';
      }
      // Si el email contiene 'owner', asignar rol owner
      else if (user.email.toLowerCase().includes('owner')) {
        newRole = 'owner';
      }
      // Si el email contiene 'broker', asignar rol broker
      else if (user.email.toLowerCase().includes('broker')) {
        newRole = 'broker';
      }
      // Si el email contiene 'provider', asignar rol provider
      else if (user.email.toLowerCase().includes('provider')) {
        newRole = 'provider';
      }
      // Si el email contiene 'maintenance', asignar rol maintenance
      else if (user.email.toLowerCase().includes('maintenance')) {
        newRole = 'maintenance';
      }
      // Si el email contiene 'runner', asignar rol runner
      else if (user.email.toLowerCase().includes('runner')) {
        newRole = 'runner';
      }
      // Si el email contiene 'support', asignar rol support
      else if (user.email.toLowerCase().includes('support')) {
        newRole = 'support';
      }

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: newRole,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ ${user.name} (${user.email}): "${user.role}" → "${newRole}"`);
      } catch (error) {
        console.error(`❌ Error actualizando ${user.name}:`, error.message);
      }
    }

    console.log('\n🎉 Corrección de roles completada!');
    console.log('💡 Los usuarios ahora pueden acceder a sus dashboards correspondientes según su rol.');

  } catch (error) {
    console.error('❌ Error en el script de corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixUserRoles()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { fixUserRoles };
