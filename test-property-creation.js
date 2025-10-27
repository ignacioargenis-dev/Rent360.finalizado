// Script para diagnosticar problemas con creación de propiedades
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

async function testPropertyCreation() {
  try {
    console.log('🔍 DIAGNOSTICANDO CREACIÓN DE PROPIEDADES...\n');

    await prisma.$connect();

    // 1. Verificar configuración de base de datos
    console.log('📊 1. Verificando configuración de base de datos...');
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.log('❌ DATABASE_URL no está configurado');
      return;
    }
    console.log('✅ DATABASE_URL configurado');

    // 2. Verificar usuarios OWNER disponibles
    console.log('\n👤 2. Verificando usuarios OWNER disponibles...');
    const owners = await prisma.user.findMany({
      where: {
        role: 'OWNER',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: 5,
    });

    if (owners.length === 0) {
      console.log('❌ No hay usuarios OWNER activos');
      console.log('💡 Necesitas crear usuarios OWNER primero');
    } else {
      console.log('✅ Usuarios OWNER encontrados:');
      owners.forEach(owner => {
        console.log(`   - ${owner.name} (${owner.email}) - ID: ${owner.id}`);
      });
    }

    // 3. Verificar configuración de cloud storage
    console.log('\n☁️ 3. Verificando configuración de cloud storage...');
    const cloudConfig = {
      DO_ACCESS_KEY_ID: process.env.DO_ACCESS_KEY_ID,
      DO_SECRET_ACCESS_KEY: process.env.DO_SECRET_ACCESS_KEY,
      DO_REGION: process.env.DO_REGION,
      DO_BUCKET_NAME: process.env.DO_BUCKET_NAME,
      DO_ENDPOINT: process.env.DO_ENDPOINT,
    };

    let cloudConfigOk = true;
    Object.entries(cloudConfig).forEach(([key, value]) => {
      if (!value) {
        console.log(`❌ ${key} no está configurado`);
        cloudConfigOk = false;
      }
    });

    if (cloudConfigOk) {
      console.log('✅ Configuración de DigitalOcean Spaces completa');
    } else {
      console.log('⚠️ Configuración de cloud storage incompleta - las imágenes podrían fallar');
    }

    // 4. Verificar esquema de base de datos - campos de propiedad
    console.log('\n🗄️ 4. Verificando esquema de propiedades...');
    try {
      // Intentar una consulta básica para verificar que la tabla existe
      const propertyCount = await prisma.property.count();
      console.log(`✅ Tabla 'property' existe con ${propertyCount} registros`);

      // Verificar campos requeridos
      const sampleProperty = await prisma.property.findFirst({
        select: {
          id: true,
          title: true,
          description: true,
          address: true,
          city: true,
          commune: true,
          region: true,
          price: true,
          bedrooms: true,
          bathrooms: true,
          area: true,
          type: true,
          status: true,
          ownerId: true,
          createdAt: true,
          // Campos nuevos que podrían causar problemas
          furnished: true,
          petFriendly: true,
          parkingSpaces: true,
          heating: true,
          cooling: true,
          internet: true,
          elevator: true,
        },
      });

      if (sampleProperty) {
        console.log('✅ Campos de propiedad verificados correctamente');
        console.log(`   Muestra: "${sampleProperty.title}" - Status: ${sampleProperty.status}`);
      }
    } catch (dbError) {
      console.log('❌ Error en esquema de base de datos:');
      console.log(`   ${dbError.message}`);
    }

    // 5. Probar crear una propiedad mínima (sin imágenes)
    console.log('\n🏠 5. Probando creación de propiedad básica...');
    if (owners.length > 0) {
      try {
        const testProperty = await prisma.property.create({
          data: {
            title: 'Propiedad de Prueba - Diagnóstico',
            description: 'Esta es una propiedad de prueba para diagnosticar problemas de creación',
            address: 'Dirección de Prueba 123',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 500000,
            deposit: 1000000,
            bedrooms: 2,
            bathrooms: 1,
            area: 80,
            type: 'APARTMENT',
            status: 'PENDING',
            ownerId: owners[0].id,
            createdBy: owners[0].id,
            // Campos nuevos con valores por defecto
            furnished: false,
            petFriendly: false,
            parkingSpaces: 0,
            heating: false,
            cooling: false,
            internet: false,
            elevator: false,
            balcony: false,
            terrace: false,
            garden: false,
            pool: false,
            gym: false,
            security: false,
            concierge: false,
          },
        });

        console.log('✅ Propiedad de prueba creada exitosamente:');
        console.log(`   ID: ${testProperty.id}`);
        console.log(`   Title: ${testProperty.title}`);
        console.log(`   Status: ${testProperty.status}`);

        // Limpiar propiedad de prueba
        await prisma.property.delete({
          where: { id: testProperty.id },
        });
        console.log('🧹 Propiedad de prueba eliminada');
      } catch (createError) {
        console.log('❌ Error creando propiedad de prueba:');
        console.log(`   ${createError.message}`);
        if (createError.code) {
          console.log(`   Código de error: ${createError.code}`);
        }
      }
    } else {
      console.log('⚠️ No se puede probar creación - no hay usuarios OWNER');
    }

    // 6. Verificar configuración de validación de archivos
    console.log('\n📁 6. Verificando configuración de archivos...');
    try {
      const { getCloudStorageService } = require('./src/lib/cloud-storage');
      const cloudService = getCloudStorageService();
      console.log('✅ Servicio de cloud storage importado correctamente');

      // Verificar que el servicio tenga los métodos necesarios
      if (typeof cloudService.uploadFile === 'function') {
        console.log('✅ Método uploadFile disponible');
      } else {
        console.log('❌ Método uploadFile no encontrado');
      }
    } catch (cloudError) {
      console.log('❌ Error importando servicio de cloud storage:');
      console.log(`   ${cloudError.message}`);
    }

    console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
    console.log('=====================================');

    const issues = [];

    if (owners.length === 0) {
      issues.push('No hay usuarios OWNER activos');
    }
    if (!cloudConfigOk) {
      issues.push('Configuración de cloud storage incompleta');
    }

    if (issues.length === 0) {
      console.log('✅ No se encontraron problemas críticos');
      console.log('💡 Si aún hay errores, revisa los logs del servidor para más detalles');
    } else {
      console.log('❌ Problemas encontrados:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    await prisma.$disconnect();
  }
}

testPropertyCreation();
