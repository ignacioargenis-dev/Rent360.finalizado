// Script para verificar y configurar la aprobación automática de propiedades
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/"/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAutoApproval() {
  try {
    console.log('🔍 Verificando configuración de aprobación automática...\n');

    await prisma.$connect();

    // Verificar si existe la configuración
    const autoApprovalSetting = await prisma.systemSetting.findFirst({
      where: {
        category: 'property_approval',
        key: 'auto_approval_enabled',
      },
    });

    console.log('📊 Estado actual de auto-aprobación:');
    if (autoApprovalSetting) {
      console.log(`   - ID: ${autoApprovalSetting.id}`);
      console.log(`   - Valor: ${autoApprovalSetting.value}`);
      console.log(`   - Descripción: ${autoApprovalSetting.description || 'Sin descripción'}`);
      console.log(`   - Activo: ${autoApprovalSetting.isActive ? '✅' : '❌'}`);

      if (autoApprovalSetting.value === 'true') {
        console.log('✅ La aprobación automática está ACTIVADA');
      } else {
        console.log('❌ La aprobación automática está DESACTIVADA');
      }
    } else {
      console.log('❌ No existe configuración de aprobación automática');
    }

    // Verificar propiedades recientes para ver su status
    console.log('\n🏠 Verificando propiedades recientes:');
    const recentProperties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    recentProperties.forEach((prop, index) => {
      console.log(`${index + 1}. "${prop.title}"`);
      console.log(`   ├─ Status: ${prop.status}`);
      console.log(`   ├─ Owner: ${prop.owner?.name || 'Sin owner'}`);
      console.log(`   └─ Creada: ${prop.createdAt}`);
      console.log('');
    });

    // Crear configuración si no existe
    if (!autoApprovalSetting) {
      console.log('🔧 Creando configuración de aprobación automática...');

      const newSetting = await prisma.systemSetting.create({
        data: {
          category: 'property_approval',
          key: 'auto_approval_enabled',
          value: 'true', // Activada por defecto
          description: 'Habilita la aprobación automática de propiedades nuevas',
          isActive: true,
        },
      });

      console.log('✅ Configuración creada:');
      console.log(`   - ID: ${newSetting.id}`);
      console.log(`   - Valor: ${newSetting.value}`);
      console.log('✅ Aprobación automática ACTIVADA por defecto');
    } else if (autoApprovalSetting.value !== 'true') {
      console.log('🔧 Activando aprobación automática...');

      await prisma.systemSetting.update({
        where: { id: autoApprovalSetting.id },
        data: { value: 'true' },
      });

      console.log('✅ Aprobación automática ACTIVADA');
    }

    // Verificar si hay propiedades PENDING que deberían ser APROBADAS
    const pendingProperties = await prisma.property.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingProperties.length > 0) {
      console.log('\n⚠️ Propiedades pendientes encontradas:');
      console.log(`   Total: ${pendingProperties.length} propiedades`);

      if (autoApprovalSetting?.value === 'true') {
        console.log('🔄 Convirtiendo propiedades PENDING a AVAILABLE...');

        const updateResult = await prisma.property.updateMany({
          where: { status: 'PENDING' },
          data: { status: 'AVAILABLE' },
        });

        console.log(`✅ Actualizadas: ${updateResult.count} propiedades`);
        console.log('   Status: PENDING → AVAILABLE');
      }
    } else {
      console.log('\n✅ No hay propiedades pendientes');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

checkAutoApproval();
