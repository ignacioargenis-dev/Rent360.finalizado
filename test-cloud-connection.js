#!/usr/bin/env node

// Importar directamente las dependencias necesarias
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async function testCloudConnection() {
  console.log('🔍 Probando conexión con DigitalOcean Spaces...\n');

  // Verificar variables de entorno
  const accessKey = process.env.DO_SPACES_ACCESS_KEY;
  const secretKey = process.env.DO_SPACES_SECRET_KEY;
  const bucket = process.env.DO_SPACES_BUCKET;
  const region = process.env.DO_SPACES_REGION;

  if (!accessKey || !secretKey || !bucket || !region) {
    console.error('❌ Variables de entorno faltantes:');
    console.log(`   DO_SPACES_ACCESS_KEY: ${accessKey ? '✅' : '❌'}`);
    console.log(`   DO_SPACES_SECRET_KEY: ${secretKey ? '✅' : '❌'}`);
    console.log(`   DO_SPACES_BUCKET: ${bucket ? '✅' : '❌'}`);
    console.log(`   DO_SPACES_REGION: ${region ? '✅' : '❌'}`);
    process.exit(1);
  }

  try {
    // Crear cliente S3 para DigitalOcean Spaces
    const s3Client = new S3Client({
      endpoint: `https://${region}.digitaloceanspaces.com`,
      region: region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    // Crear archivo de prueba
    const testKey = `test-connection-${Date.now()}.txt`;
    const testContent = `Test connection - ${new Date().toISOString()}\nRent360 Cloud Storage Test`;

    console.log('📤 Subiendo archivo de prueba...');
    const uploadCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    await s3Client.send(uploadCommand);
    console.log('✅ Archivo subido exitosamente!');
    console.log(`📁 URL: https://${bucket}.${region}.digitaloceanspaces.com/${testKey}`);

    // Verificar que existe
    console.log('\n🔍 Verificando que el archivo existe...');
    const headCommand = new HeadObjectCommand({
      Bucket: bucket,
      Key: testKey,
    });

    try {
      await s3Client.send(headCommand);
      console.log('📊 Archivo existe: ✅');
    } catch (error) {
      console.log('📊 Archivo existe: ❌');
      throw error;
    }

    // Limpiar
    console.log('\n🧹 Eliminando archivo de prueba...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: testKey,
    });

    await s3Client.send(deleteCommand);
    console.log('✅ Archivo eliminado');

    console.log('\n🎉 ¡Conexión exitosa! DigitalOcean Spaces está funcionando correctamente.');
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
