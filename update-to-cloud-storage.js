#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function updateToCloudStorage() {
  console.log('🔄 Actualizando código para usar cloud storage...\n');

  const updates = [
    {
      file: 'src/app/api/properties/[id]/images/route.ts',
      action: 'backup',
      description: 'Respaldar ruta local actual',
    },
    {
      file: 'src/app/api/properties/[id]/images/route-cloud.ts',
      action: 'activate',
      description: 'Activar ruta de cloud storage',
    },
  ];

  try {
    // 1. Respaldar la ruta local
    const localRoute = 'src/app/api/properties/[id]/images/route.ts';
    const backupRoute = 'src/app/api/properties/[id]/images/route-local-backup.ts';

    if (fs.existsSync(localRoute)) {
      fs.copyFileSync(localRoute, backupRoute);
      console.log('✅ Respaldada ruta local:', backupRoute);
    }

    // 2. Activar la ruta de cloud storage
    const cloudRoute = 'src/app/api/properties/[id]/images/route-cloud.ts';
    if (fs.existsSync(cloudRoute)) {
      fs.copyFileSync(cloudRoute, localRoute);
      console.log('✅ Activada ruta de cloud storage');
    }

    // 3. Actualizar variables de entorno
    console.log('\n📋 Variables de entorno necesarias en .env:');
    console.log('DO_SPACES_ACCESS_KEY=tu_access_key');
    console.log('DO_SPACES_SECRET_KEY=tu_secret_key');
    console.log('DO_SPACES_BUCKET=rent360-images');
    console.log('DO_SPACES_REGION=nyc3');

    // 4. Verificar que el servicio de cloud storage esté disponible
    const cloudStorageFile = 'src/lib/cloud-storage.ts';
    if (fs.existsSync(cloudStorageFile)) {
      console.log('✅ Servicio de cloud storage disponible');
    } else {
      console.log('❌ Servicio de cloud storage no encontrado');
    }

    console.log('\n🎉 Actualización completada!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. ✅ Código actualizado para cloud storage');
    console.log('   2. 🔄 Ejecutar migración: node migrate-images-to-cloud.js');
    console.log('   3. 🚀 Desplegar a producción');
  } catch (error) {
    console.error('❌ Error actualizando código:', error.message);
  }
}

updateToCloudStorage();
