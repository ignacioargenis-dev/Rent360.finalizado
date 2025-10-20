#!/usr/bin/env node

const { getCloudStorageService } = require('./src/lib/cloud-storage');

async function testCloudConnection() {
  console.log('🔍 Probando conexión con cloud storage...\n');

  try {
    const cloudStorage = getCloudStorageService();

    // Crear archivo de prueba
    const testKey = `test-connection-${Date.now()}.txt`;
    const testContent = `Test connection - ${new Date().toISOString()}\nRent360 Cloud Storage Test`;

    console.log('📤 Subiendo archivo de prueba...');
    const result = await cloudStorage.uploadFile(Buffer.from(testContent), testKey, 'text/plain');

    console.log('✅ Archivo subido exitosamente!');
    console.log(`📁 URL: ${result.url}`);
    console.log(`🔑 Key: ${result.key}`);

    // Verificar que existe
    console.log('\n🔍 Verificando que el archivo existe...');
    const exists = await cloudStorage.fileExists(testKey);
    console.log(`📊 Archivo existe: ${exists ? '✅' : '❌'}`);

    // Limpiar
    console.log('\n🧹 Eliminando archivo de prueba...');
    await cloudStorage.deleteFile(testKey);
    console.log('✅ Archivo eliminado');

    console.log('\n🎉 ¡Conexión exitosa! Cloud storage está funcionando correctamente.');
    console.log('\n💡 Puedes proceder con la migración: node migrate-images-to-cloud.js');
  } catch (error) {
    console.error('❌ Error en la conexión:', error.message);

    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que las variables de entorno estén configuradas:');
    console.log('   - DO_SPACES_ACCESS_KEY');
    console.log('   - DO_SPACES_SECRET_KEY');
    console.log('   - DO_SPACES_BUCKET');
    console.log('   - DO_SPACES_REGION');

    console.log('\n2. Ejecuta la configuración automática:');
    console.log('   node setup-digitalocean-spaces.js');

    console.log('\n3. Verifica permisos del Space en DigitalOcean');

    process.exit(1);
  }
}

testCloudConnection();
