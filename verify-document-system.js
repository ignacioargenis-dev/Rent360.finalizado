/**
 * Script de Verificación del Sistema de Documentos
 *
 * Este script verifica:
 * 1. Si cloud storage está configurado
 * 2. Si el código actualizado está deployado
 * 3. Estado de documentos existentes
 */

const { db } = require('./src/lib/db');
const { getCloudStorageService } = require('./src/lib/cloud-storage');

async function verifyDocumentSystem() {
  console.log('🔍 Verificando Sistema de Documentos\n');
  console.log('='.repeat(60));

  // 1. Verificar variables de entorno
  console.log('\n📋 1. VARIABLES DE ENTORNO\n');

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DIGITALOCEAN_APP_ID: process.env.DIGITALOCEAN_APP_ID ? '✅ Configurado' : '❌ No configurado',
    DO_SPACES_ACCESS_KEY: process.env.DO_SPACES_ACCESS_KEY ? '✅ Configurado' : '❌ No configurado',
    DO_SPACES_SECRET_KEY: process.env.DO_SPACES_SECRET_KEY ? '✅ Configurado' : '❌ No configurado',
    DO_SPACES_BUCKET: process.env.DO_SPACES_BUCKET || '❌ No configurado',
    DO_SPACES_REGION: process.env.DO_SPACES_REGION || '❌ No configurado',
  };

  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DIGITALOCEAN_APP_ID;
  const hasCloudStorage = process.env.DO_SPACES_ACCESS_KEY && process.env.DO_SPACES_SECRET_KEY;

  console.log(`\n  🏢 Entorno Detectado: ${isProduction ? '🔴 PRODUCCIÓN' : '🟡 DESARROLLO'}`);
  console.log(`  ☁️  Cloud Storage: ${hasCloudStorage ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}`);

  // 2. Verificar conexión a cloud storage
  if (hasCloudStorage) {
    console.log('\n📋 2. CONEXIÓN A CLOUD STORAGE\n');
    try {
      const cloudStorage = getCloudStorageService();
      console.log('  ✅ Servicio de cloud storage inicializado correctamente');
      console.log(`  ✅ Bucket: ${process.env.DO_SPACES_BUCKET}`);
      console.log(`  ✅ Region: ${process.env.DO_SPACES_REGION}`);
    } catch (error) {
      console.log('  ❌ Error al inicializar cloud storage:', error.message);
    }
  } else {
    console.log('\n📋 2. CONEXIÓN A CLOUD STORAGE\n');
    console.log('  ⚠️  Cloud storage NO configurado (normal en desarrollo)');
  }

  // 3. Analizar documentos en la base de datos
  console.log('\n📋 3. ANÁLISIS DE DOCUMENTOS EN BASE DE DATOS\n');

  try {
    const documents = await db.document.findMany({
      select: {
        id: true,
        name: true,
        filePath: true,
        createdAt: true,
        uploadedBy: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    console.log(`  Total de documentos (últimos 20): ${documents.length}\n`);

    const stats = {
      cloudStorage: 0,
      localStorage: 0,
      unknown: 0,
    };

    documents.forEach((doc, index) => {
      let type = '❓ Desconocido';
      let status = '';

      if (doc.filePath.startsWith('http://') || doc.filePath.startsWith('https://')) {
        type = '☁️  Cloud Storage';
        status = '✅ SEGURO';
        stats.cloudStorage++;
      } else if (doc.filePath.startsWith('/uploads/') || doc.filePath.startsWith('uploads/')) {
        type = '💾 Local (Efímero)';
        status = '⚠️  PUEDE PERDERSE';
        stats.localStorage++;
      } else {
        type = '❓ Desconocido';
        status = '❓ VERIFICAR';
        stats.unknown++;
      }

      const date = new Date(doc.createdAt).toLocaleString('es-ES');
      const userName = doc.uploadedBy?.name || 'Usuario desconocido';

      console.log(`  ${index + 1}. ${doc.name}`);
      console.log(`     Tipo: ${type} | Estado: ${status}`);
      console.log(`     Subido: ${date} por ${userName}`);
      console.log(`     Path: ${doc.filePath}`);
      console.log();
    });

    console.log('  📊 ESTADÍSTICAS:');
    console.log(`     ☁️  En Cloud Storage: ${stats.cloudStorage} documentos`);
    console.log(`     💾 En Local (Efímero): ${stats.localStorage} documentos`);
    console.log(`     ❓ Desconocidos: ${stats.unknown} documentos`);

    // Advertencias
    if (stats.localStorage > 0 && isProduction) {
      console.log('\n  ⚠️  ADVERTENCIA: Hay documentos guardados localmente en PRODUCCIÓN');
      console.log('     Estos documentos se perderán con el próximo restart/deploy');
      console.log('     Los usuarios deben re-subirlos después del deploy de la solución');
    }
  } catch (error) {
    console.log('  ❌ Error al analizar documentos:', error.message);
  }

  // 4. Recomendaciones
  console.log('\n📋 4. RECOMENDACIONES\n');

  if (!hasCloudStorage && isProduction) {
    console.log('  🔴 CRÍTICO: Cloud storage no está configurado en PRODUCCIÓN');
    console.log('     Acción: Configurar variables DO_SPACES en DigitalOcean');
  } else if (hasCloudStorage && isProduction) {
    console.log('  ✅ Cloud storage configurado correctamente en producción');
  }

  if (!isProduction) {
    console.log('  🟡 Estás en DESARROLLO - usando almacenamiento local (normal)');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Verificación completada\n');

  process.exit(0);
}

verifyDocumentSystem().catch(error => {
  console.error('❌ Error ejecutando verificación:', error);
  process.exit(1);
});
